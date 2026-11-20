-- Explicitly handle order status transitions and inventory impact
BEGIN;

CREATE OR REPLACE FUNCTION public.change_order_status(
    p_order_id UUID,
    p_new_status public.order_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_order public.orders%ROWTYPE;
    v_assignment RECORD;
    v_stock public.warehouse_stock%ROWTYPE;
    v_activity public.inventory_activity_type := NULL;
BEGIN
    -- 1. Check order module permissions
    IF p_new_status = 'in_progress' THEN
        IF NOT public.has_module_permission('orders', TRUE) THEN
            RAISE EXCEPTION 'Insufficient orders permissions';
        END IF;
    ELSIF p_new_status IN ('paid', 'cancelled') THEN
        IF NOT public.has_module_permission('orders', TRUE)
           OR NOT public.has_module_permission('inventory', TRUE) THEN
            RAISE EXCEPTION 'Insufficient orders or inventory permissions';
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid target order status: %', p_new_status;
    END IF;

    -- 2. Fetch and lock order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 3. Explicitly evaluate the transition (current_status -> new_status)
    IF v_order.status = 'pending' AND p_new_status = 'in_progress' THEN
        -- Transition: pending -> in_progress
        -- Inventory impact: None (stock remains reserved)
        v_activity := NULL;

    ELSIF (v_order.status = 'pending' OR v_order.status = 'in_progress') AND p_new_status = 'paid' THEN
        -- Transition: pending -> paid OR in_progress -> paid
        -- Inventory impact: Consume reserved stock
        v_activity := 'consumption'::public.inventory_activity_type;

    ELSIF (v_order.status = 'pending' OR v_order.status = 'in_progress') AND p_new_status = 'cancelled' THEN
        -- Transition: pending -> cancelled OR in_progress -> cancelled
        -- Inventory impact: Release reserved stock
        v_activity := 'release'::public.inventory_activity_type;

    ELSIF v_order.status IN ('paid', 'cancelled') THEN
        RAISE EXCEPTION 'Order has already been finalized (% status cannot be changed)', v_order.status;

    ELSE
        RAISE EXCEPTION 'Invalid status transition from % to %', v_order.status, p_new_status;
    END IF;

    -- 4. Apply inventory modifications only for transitions that affect inventory
    IF v_activity IS NOT NULL THEN
        FOR v_assignment IN
            SELECT oi.*
            FROM public.order_inventory oi
            WHERE oi.order_id = p_order_id
            ORDER BY oi.warehouse_id, oi.item_id
        LOOP
            SELECT * INTO v_stock
            FROM public.warehouse_stock
            WHERE item_id = v_assignment.item_id
              AND warehouse_id = v_assignment.warehouse_id
            FOR UPDATE;

            IF v_stock.id IS NULL OR v_stock.reserved_quantity < v_assignment.quantity THEN
                RAISE EXCEPTION 'Reserved stock inconsistency for item %', v_assignment.item_id;
            END IF;

            IF v_activity = 'consumption' THEN
                -- Move from reserved to used
                UPDATE public.warehouse_stock
                SET reserved_quantity = reserved_quantity - v_assignment.quantity,
                    used_quantity = used_quantity + v_assignment.quantity
                WHERE id = v_stock.id;

                INSERT INTO public.inventory_activity_logs(
                    item_id, warehouse_id, activity_type, quantity,
                    previous_total, new_total,
                    previous_reserved, new_reserved,
                    previous_used, new_used,
                    related_order_id, performed_by
                )
                VALUES (
                    v_assignment.item_id, v_assignment.warehouse_id, 'consumption', v_assignment.quantity,
                    v_stock.total_quantity, v_stock.total_quantity,
                    v_stock.reserved_quantity, v_stock.reserved_quantity - v_assignment.quantity,
                    v_stock.used_quantity, v_stock.used_quantity + v_assignment.quantity,
                    p_order_id, v_user
                );

            ELSIF v_activity = 'release' THEN
                -- Remove reservation, returning stock to available
                UPDATE public.warehouse_stock
                SET reserved_quantity = reserved_quantity - v_assignment.quantity
                WHERE id = v_stock.id;

                INSERT INTO public.inventory_activity_logs(
                    item_id, warehouse_id, activity_type, quantity,
                    previous_total, new_total,
                    previous_reserved, new_reserved,
                    previous_used, new_used,
                    related_order_id, performed_by
                )
                VALUES (
                    v_assignment.item_id, v_assignment.warehouse_id, 'release', v_assignment.quantity,
                    v_stock.total_quantity, v_stock.total_quantity,
                    v_stock.reserved_quantity, v_stock.reserved_quantity - v_assignment.quantity,
                    v_stock.used_quantity, v_stock.used_quantity,
                    p_order_id, v_user
                );
            ELSE
                RAISE EXCEPTION 'Unhandled inventory activity type: %', v_activity;
            END IF;
        END LOOP;
    END IF;

    -- 5. Update order status
    PERFORM set_config('app.allow_order_status_change', 'true', TRUE);

    UPDATE public.orders
    SET status = p_new_status
    WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.change_order_status(uuid, public.order_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_order_status(uuid, public.order_status) TO "anon", "authenticated", "service_role";

COMMIT;
