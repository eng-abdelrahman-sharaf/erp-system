BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 1. ENUM TYPES
-- ------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE public.account_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.employment_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.module_name AS ENUM ('users', 'orders', 'employees', 'inventory');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.inventory_activity_type AS ENUM (
        'addition',
        'manual_usage',
        'reservation',
        'release',
        'consumption',
        'transfer_out',
        'transfer_in'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM (
        'cash',
        'bank_transfer',
        'instapay',
        'check',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 2. USERS, ROLES AND PERMISSIONS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    module public.module_name NOT NULL,
    can_read BOOLEAN NOT NULL DEFAULT FALSE,
    can_write BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (role_id, module),
    CHECK (NOT can_write OR can_read)
);

-- id is the corresponding auth.users.id. Authentication credentials
-- and password hashes remain exclusively in Supabase Auth.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    status public.account_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. EMPLOYEES AND PAYROLL
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    position VARCHAR(150),
    salary NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (salary >= 0),
    employment_date DATE NOT NULL,
    status public.employment_status NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    salary_amount NUMERIC(14,2) NOT NULL CHECK (salary_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, period_start, period_end),
    CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS public.salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    method public.payment_method NOT NULL,
    reference_number VARCHAR(255),
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. INVENTORY
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouse_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    total_quantity NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
    reserved_quantity NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    used_quantity NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (used_quantity >= 0),
    available_quantity NUMERIC(14,2)
        GENERATED ALWAYS AS (total_quantity - reserved_quantity - used_quantity) STORED,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (item_id, warehouse_id),
    CHECK (total_quantity >= reserved_quantity + used_quantity)
);

-- ------------------------------------------------------------
-- 5. ORDERS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    client_address TEXT,
    employee_id UUID REFERENCES public.employees(id) ON DELETE RESTRICT,
    status public.order_status NOT NULL DEFAULT 'pending',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    quantity NUMERIC(14,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (order_id, item_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS public.order_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. INVENTORY TRANSFERS AND ACTIVITY LOGS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.warehouse_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    source_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    destination_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    quantity NUMERIC(14,2) NOT NULL CHECK (quantity > 0),
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (source_warehouse_id <> destination_warehouse_id)
);

CREATE TABLE IF NOT EXISTS public.inventory_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    activity_type public.inventory_activity_type NOT NULL,
    quantity NUMERIC(14,2) NOT NULL CHECK (quantity > 0),
    previous_total NUMERIC(14,2) NOT NULL,
    new_total NUMERIC(14,2) NOT NULL,
    previous_reserved NUMERIC(14,2) NOT NULL,
    new_reserved NUMERIC(14,2) NOT NULL,
    previous_used NUMERIC(14,2) NOT NULL,
    new_used NUMERIC(14,2) NOT NULL,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
    transfer_id UUID REFERENCES public.warehouse_transfers(id) ON DELETE RESTRICT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. INDEXES
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_name ON public.employees(full_name);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON public.payroll_periods(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_period ON public.salary_payments(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_date ON public.salary_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_warehouse ON public.warehouse_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON public.inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_item ON public.inventory_activity_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_warehouse ON public.inventory_activity_logs(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON public.inventory_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON public.warehouse_transfers(transfer_date);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_employee ON public.orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_inventory_order ON public.order_inventory(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_order ON public.order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_activity_order ON public.order_activity_logs(order_id);

-- ------------------------------------------------------------
-- 8. UPDATED_AT TRIGGER
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_warehouse_stock_updated_at ON public.warehouse_stock;
CREATE TRIGGER trg_warehouse_stock_updated_at
BEFORE UPDATE ON public.warehouse_stock
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 9. AUTHORIZATION HELPER
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_module_permission(
    p_module public.module_name,
    p_write BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles AS p
        JOIN public.role_permissions AS rp ON rp.role_id = p.role_id
        WHERE p.id = (SELECT auth.uid())
          AND p.status = 'active'
          AND rp.module = p_module
          AND (
              (NOT p_write AND rp.can_read)
              OR (p_write AND rp.can_write)
          )
    );
$$;

REVOKE ALL ON FUNCTION public.has_module_permission(public.module_name, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_module_permission(public.module_name, BOOLEAN) TO authenticated;

-- ------------------------------------------------------------
-- 10. IMMUTABLE AUDIT LOGS
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable; updates and deletes are prohibited';
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_inventory_logs ON public.inventory_activity_logs;
CREATE TRIGGER trg_immutable_inventory_logs
BEFORE UPDATE OR DELETE ON public.inventory_activity_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS trg_immutable_order_logs ON public.order_activity_logs;
CREATE TRIGGER trg_immutable_order_logs
BEFORE UPDATE OR DELETE ON public.order_activity_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- ------------------------------------------------------------
-- 11. ORDER VALIDATION AND AUTOMATIC ACTIVITY LOGGING
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_order_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.employee_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM public.employees e
        WHERE e.id = NEW.employee_id
          AND e.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Only active employees can be assigned to orders';
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF current_setting('app.allow_order_status_change', TRUE) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'Change order status using the change_order_status RPC';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_order_employee ON public.orders;
CREATE TRIGGER trg_validate_order_employee
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_employee();

CREATE OR REPLACE FUNCTION public.log_order_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor UUID;
BEGIN
    v_actor := auth.uid();

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.order_activity_logs(order_id, activity_type, description, performed_by)
        VALUES (NEW.id, 'order_created', 'Order created', v_actor);
        RETURN NEW;
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_activity_logs(order_id, activity_type, description, performed_by)
        VALUES (
            NEW.id,
            'status_changed',
            'Order status changed from ' || OLD.status::TEXT || ' to ' || NEW.status::TEXT,
            v_actor
        );
    END IF;

    IF OLD.employee_id IS DISTINCT FROM NEW.employee_id THEN
        INSERT INTO public.order_activity_logs(order_id, activity_type, description, performed_by)
        VALUES (
            NEW.id,
            CASE WHEN OLD.employee_id IS NULL THEN 'employee_assigned' ELSE 'employee_reassigned' END,
            'Assigned employee changed from ' || COALESCE(OLD.employee_id::TEXT, 'none')
                || ' to ' || COALESCE(NEW.employee_id::TEXT, 'none'),
            v_actor
        );
    END IF;

    IF (to_jsonb(OLD) - 'updated_at' - 'status' - 'employee_id')
       IS DISTINCT FROM
       (to_jsonb(NEW) - 'updated_at' - 'status' - 'employee_id') THEN
        INSERT INTO public.order_activity_logs(order_id, activity_type, description, performed_by)
        VALUES (NEW.id, 'order_updated', 'Order information updated', v_actor);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_changes ON public.orders;
CREATE TRIGGER trg_log_order_changes
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_changes();

-- ------------------------------------------------------------
-- 12. ORDER NOTE ACTIVITY LOGGING
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_order_note()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.order_activity_logs(order_id, activity_type, description, performed_by)
    VALUES (NEW.order_id, 'note_added', 'Order note added', NEW.created_by);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_note ON public.order_notes;
CREATE TRIGGER trg_log_order_note
AFTER INSERT ON public.order_notes
FOR EACH ROW EXECUTE FUNCTION public.log_order_note();

-- ------------------------------------------------------------
-- 13. INVENTORY ADJUSTMENT RPC
-- Supports stock additions and manual usage.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.adjust_inventory(
    p_item_id UUID,
    p_warehouse_id UUID,
    p_activity public.inventory_activity_type,
    p_quantity NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_stock public.warehouse_stock%ROWTYPE;
    v_log_id UUID;
BEGIN
    IF NOT public.has_module_permission('inventory', TRUE) THEN
        RAISE EXCEPTION 'Insufficient inventory permissions';
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    IF p_activity NOT IN ('addition', 'manual_usage') THEN
        RAISE EXCEPTION 'This RPC supports addition or manual_usage only';
    END IF;

    INSERT INTO public.warehouse_stock(item_id, warehouse_id)
    VALUES (p_item_id, p_warehouse_id)
    ON CONFLICT (item_id, warehouse_id) DO NOTHING;

    SELECT * INTO v_stock
    FROM public.warehouse_stock
    WHERE item_id = p_item_id AND warehouse_id = p_warehouse_id
    FOR UPDATE;

    IF p_activity = 'manual_usage' AND v_stock.available_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient available stock';
    END IF;

    IF p_activity = 'addition' THEN
        UPDATE public.warehouse_stock
        SET total_quantity = total_quantity + p_quantity
        WHERE id = v_stock.id;
    ELSE
        UPDATE public.warehouse_stock
        SET used_quantity = used_quantity + p_quantity
        WHERE id = v_stock.id;
    END IF;

    INSERT INTO public.inventory_activity_logs(
        item_id, warehouse_id, activity_type, quantity,
        previous_total, new_total,
        previous_reserved, new_reserved,
        previous_used, new_used,
        performed_by, notes
    )
    VALUES (
        p_item_id, p_warehouse_id, p_activity, p_quantity,
        v_stock.total_quantity,
        CASE WHEN p_activity = 'addition' THEN v_stock.total_quantity + p_quantity ELSE v_stock.total_quantity END,
        v_stock.reserved_quantity, v_stock.reserved_quantity,
        v_stock.used_quantity,
        CASE WHEN p_activity = 'manual_usage' THEN v_stock.used_quantity + p_quantity ELSE v_stock.used_quantity END,
        v_user, p_notes
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- ------------------------------------------------------------
-- 14. ATOMIC WAREHOUSE TRANSFER RPC
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.transfer_inventory(
    p_item_id UUID,
    p_source_warehouse_id UUID,
    p_destination_warehouse_id UUID,
    p_quantity NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_transfer_id UUID;
    v_source public.warehouse_stock%ROWTYPE;
    v_destination public.warehouse_stock%ROWTYPE;
BEGIN
    IF NOT public.has_module_permission('inventory', TRUE) THEN
        RAISE EXCEPTION 'Insufficient inventory permissions';
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    IF p_source_warehouse_id = p_destination_warehouse_id THEN
        RAISE EXCEPTION 'Source and destination warehouses must differ';
    END IF;

    INSERT INTO public.warehouse_stock(item_id, warehouse_id)
    VALUES (p_item_id, p_destination_warehouse_id)
    ON CONFLICT (item_id, warehouse_id) DO NOTHING;

    -- Lock both rows in a stable order to reduce deadlock risk.
    PERFORM s.id
    FROM public.warehouse_stock s
    WHERE s.item_id = p_item_id
      AND s.warehouse_id IN (p_source_warehouse_id, p_destination_warehouse_id)
    ORDER BY s.warehouse_id
    FOR UPDATE;

    SELECT * INTO v_source
    FROM public.warehouse_stock
    WHERE item_id = p_item_id AND warehouse_id = p_source_warehouse_id;

    SELECT * INTO v_destination
    FROM public.warehouse_stock
    WHERE item_id = p_item_id AND warehouse_id = p_destination_warehouse_id;

    IF v_source.id IS NULL THEN
        RAISE EXCEPTION 'Source stock record does not exist';
    END IF;

    IF v_source.available_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient available stock';
    END IF;

    INSERT INTO public.warehouse_transfers(
        item_id, source_warehouse_id, destination_warehouse_id,
        quantity, notes, performed_by
    )
    VALUES (
        p_item_id, p_source_warehouse_id, p_destination_warehouse_id,
        p_quantity, p_notes, v_user
    )
    RETURNING id INTO v_transfer_id;

    UPDATE public.warehouse_stock
    SET total_quantity = total_quantity - p_quantity
    WHERE id = v_source.id;

    UPDATE public.warehouse_stock
    SET total_quantity = total_quantity + p_quantity
    WHERE id = v_destination.id;

    INSERT INTO public.inventory_activity_logs(
        item_id, warehouse_id, activity_type, quantity,
        previous_total, new_total,
        previous_reserved, new_reserved,
        previous_used, new_used,
        transfer_id, performed_by, notes
    )
    VALUES
    (
        p_item_id, p_source_warehouse_id, 'transfer_out', p_quantity,
        v_source.total_quantity, v_source.total_quantity - p_quantity,
        v_source.reserved_quantity, v_source.reserved_quantity,
        v_source.used_quantity, v_source.used_quantity,
        v_transfer_id, v_user, p_notes
    ),
    (
        p_item_id, p_destination_warehouse_id, 'transfer_in', p_quantity,
        v_destination.total_quantity, v_destination.total_quantity + p_quantity,
        v_destination.reserved_quantity, v_destination.reserved_quantity,
        v_destination.used_quantity, v_destination.used_quantity,
        v_transfer_id, v_user, p_notes
    );

    RETURN v_transfer_id;
END;
$$;

-- ------------------------------------------------------------
-- 15. RESERVE INVENTORY FOR AN ORDER RPC
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reserve_order_inventory(
    p_order_id UUID,
    p_item_id UUID,
    p_warehouse_id UUID,
    p_quantity NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_order public.orders%ROWTYPE;
    v_stock public.warehouse_stock%ROWTYPE;
    v_unit VARCHAR(50);
    v_assignment_id UUID;
BEGIN
    IF NOT public.has_module_permission('orders', TRUE)
       OR NOT public.has_module_permission('inventory', TRUE) THEN
        RAISE EXCEPTION 'Insufficient orders or inventory permissions';
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status NOT IN ('pending', 'in_progress') THEN
        RAISE EXCEPTION 'Inventory can only be assigned to pending or in-progress orders';
    END IF;

    SELECT i.unit INTO v_unit
    FROM public.inventory_items i
    WHERE i.id = p_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item not found';
    END IF;

    SELECT * INTO v_stock
    FROM public.warehouse_stock
    WHERE item_id = p_item_id AND warehouse_id = p_warehouse_id
    FOR UPDATE;

    IF v_stock.id IS NULL OR v_stock.available_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient available stock';
    END IF;

    UPDATE public.warehouse_stock
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE id = v_stock.id;

    INSERT INTO public.order_inventory(order_id, item_id, warehouse_id, quantity, unit)
    VALUES (p_order_id, p_item_id, p_warehouse_id, p_quantity, v_unit)
    ON CONFLICT (order_id, item_id, warehouse_id)
    DO UPDATE SET quantity = public.order_inventory.quantity + EXCLUDED.quantity
    RETURNING id INTO v_assignment_id;

    INSERT INTO public.inventory_activity_logs(
        item_id, warehouse_id, activity_type, quantity,
        previous_total, new_total,
        previous_reserved, new_reserved,
        previous_used, new_used,
        related_order_id, performed_by
    )
    VALUES (
        p_item_id, p_warehouse_id, 'reservation', p_quantity,
        v_stock.total_quantity, v_stock.total_quantity,
        v_stock.reserved_quantity, v_stock.reserved_quantity + p_quantity,
        v_stock.used_quantity, v_stock.used_quantity,
        p_order_id, v_user
    );

    INSERT INTO public.order_activity_logs(order_id, activity_type, description, performed_by)
    VALUES (
        p_order_id, 'inventory_assigned',
        'Reserved ' || p_quantity || ' ' || v_unit || ' of item ' || p_item_id,
        v_user
    );

    RETURN v_assignment_id;
END;
$$;

-- ------------------------------------------------------------
-- 16. ORDER STATUS RPC: IN_PROGRESS, PAID OR CANCELLED
-- Locks the order and stock rows; finalization is rejected once completed.
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- 17. RECORD SALARY PAYMENT RPC
-- Prevents payments exceeding the payroll period's agreed salary.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_salary_payment(
    p_payroll_period_id UUID,
    p_amount NUMERIC,
    p_payment_date DATE,
    p_method public.payment_method,
    p_reference_number TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_period public.payroll_periods%ROWTYPE;
    v_total_paid NUMERIC(14,2);
    v_payment_id UUID;
BEGIN
    IF NOT public.has_module_permission('employees', TRUE) THEN
        RAISE EXCEPTION 'Insufficient employee/payroll permissions';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero';
    END IF;

    SELECT * INTO v_period
    FROM public.payroll_periods
    WHERE id = p_payroll_period_id
    FOR UPDATE;

    IF v_period.id IS NULL THEN
        RAISE EXCEPTION 'Payroll period not found';
    END IF;

    SELECT COALESCE(SUM(sp.amount), 0)
    INTO v_total_paid
    FROM public.salary_payments sp
    WHERE sp.payroll_period_id = p_payroll_period_id;

    IF v_total_paid + p_amount > v_period.salary_amount THEN
        RAISE EXCEPTION 'Payment exceeds outstanding payroll balance';
    END IF;

    INSERT INTO public.salary_payments(
        payroll_period_id, amount, payment_date, method,
        reference_number, notes, recorded_by
    )
    VALUES (
        p_payroll_period_id, p_amount, COALESCE(p_payment_date, CURRENT_DATE),
        p_method, p_reference_number, p_notes, v_user
    )
    RETURNING id INTO v_payment_id;

    RETURN v_payment_id;
END;
$$;

-- ------------------------------------------------------------
-- 18. REPORTING VIEWS
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW public.payroll_summary
WITH (security_invoker = TRUE)
AS
SELECT
    pp.id AS payroll_period_id,
    pp.employee_id,
    e.full_name AS employee_name,
    pp.period_start,
    pp.period_end,
    pp.salary_amount,
    COALESCE(SUM(sp.amount), 0)::NUMERIC(14,2) AS total_paid,
    (pp.salary_amount - COALESCE(SUM(sp.amount), 0))::NUMERIC(14,2) AS outstanding
FROM public.payroll_periods pp
JOIN public.employees e ON e.id = pp.employee_id
LEFT JOIN public.salary_payments sp ON sp.payroll_period_id = pp.id
GROUP BY pp.id, pp.employee_id, e.full_name, pp.period_start, pp.period_end, pp.salary_amount;

CREATE OR REPLACE VIEW public.inventory_summary
WITH (security_invoker = TRUE)
AS
SELECT
    i.id AS item_id,
    i.name AS item_name,
    i.sku,
    i.unit,
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    COALESCE(ws.total_quantity, 0) AS total_quantity,
    COALESCE(ws.available_quantity, 0) AS available_quantity,
    COALESCE(ws.reserved_quantity, 0) AS reserved_quantity,
    COALESCE(ws.used_quantity, 0) AS used_quantity
FROM public.inventory_items i
CROSS JOIN public.warehouses w
LEFT JOIN public.warehouse_stock ws
    ON ws.item_id = i.id AND ws.warehouse_id = w.id;

CREATE OR REPLACE VIEW public.order_summary
WITH (security_invoker = TRUE)
AS
SELECT
    o.id,
    o.order_number,
    o.title,
    o.client_name,
    o.client_phone,
    o.client_address,
    o.status,
    o.order_date,
    o.employee_id,
    e.full_name AS employee_name,
    COUNT(DISTINCT oi.id) AS inventory_items_count,
    COALESCE(SUM(oi.quantity), 0) AS total_inventory_quantity
FROM public.orders o
LEFT JOIN public.employees e ON e.id = o.employee_id
LEFT JOIN public.order_inventory oi ON oi.order_id = o.id
GROUP BY o.id, e.full_name;

-- ------------------------------------------------------------
-- 19. ENABLE ROW LEVEL SECURITY
-- ------------------------------------------------------------

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile; users module readers can read all.
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()) OR public.has_module_permission('users', FALSE));

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (public.has_module_permission('users', TRUE));

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_module_permission('users', TRUE))
WITH CHECK (public.has_module_permission('users', TRUE));

DROP POLICY IF EXISTS profiles_delete ON public.profiles;
CREATE POLICY profiles_delete ON public.profiles
FOR DELETE TO authenticated
USING (public.has_module_permission('users', TRUE));

-- Roles and role permissions.
DROP POLICY IF EXISTS roles_select ON public.roles;
CREATE POLICY roles_select ON public.roles
FOR SELECT TO authenticated
USING (public.has_module_permission('users', FALSE));

DROP POLICY IF EXISTS roles_write ON public.roles;
CREATE POLICY roles_write ON public.roles
FOR ALL TO authenticated
USING (public.has_module_permission('users', TRUE))
WITH CHECK (public.has_module_permission('users', TRUE));

DROP POLICY IF EXISTS role_permissions_select ON public.role_permissions;
CREATE POLICY role_permissions_select ON public.role_permissions
FOR SELECT TO authenticated
USING (public.has_module_permission('users', FALSE));

DROP POLICY IF EXISTS role_permissions_write ON public.role_permissions;
CREATE POLICY role_permissions_write ON public.role_permissions
FOR ALL TO authenticated
USING (public.has_module_permission('users', TRUE))
WITH CHECK (public.has_module_permission('users', TRUE));

-- Employees.
DROP POLICY IF EXISTS employees_select ON public.employees;
CREATE POLICY employees_select ON public.employees
FOR SELECT TO authenticated
USING (public.has_module_permission('employees', FALSE));

DROP POLICY IF EXISTS employees_write ON public.employees;
CREATE POLICY employees_write ON public.employees
FOR ALL TO authenticated
USING (public.has_module_permission('employees', TRUE))
WITH CHECK (public.has_module_permission('employees', TRUE));

-- Payroll.
DROP POLICY IF EXISTS payroll_periods_select ON public.payroll_periods;
CREATE POLICY payroll_periods_select ON public.payroll_periods
FOR SELECT TO authenticated
USING (public.has_module_permission('employees', FALSE));

DROP POLICY IF EXISTS payroll_periods_write ON public.payroll_periods;
CREATE POLICY payroll_periods_write ON public.payroll_periods
FOR ALL TO authenticated
USING (public.has_module_permission('employees', TRUE))
WITH CHECK (public.has_module_permission('employees', TRUE));

DROP POLICY IF EXISTS salary_payments_select ON public.salary_payments;
CREATE POLICY salary_payments_select ON public.salary_payments
FOR SELECT TO authenticated
USING (public.has_module_permission('employees', FALSE));

DROP POLICY IF EXISTS salary_payments_insert ON public.salary_payments;
CREATE POLICY salary_payments_insert ON public.salary_payments
FOR INSERT TO authenticated
WITH CHECK (
    public.has_module_permission('employees', TRUE)
    AND recorded_by = (SELECT auth.uid())
);

-- Warehouses and inventory catalog.
DROP POLICY IF EXISTS warehouses_select ON public.warehouses;
CREATE POLICY warehouses_select ON public.warehouses
FOR SELECT TO authenticated
USING (public.has_module_permission('inventory', FALSE));

DROP POLICY IF EXISTS warehouses_write ON public.warehouses;
CREATE POLICY warehouses_write ON public.warehouses
FOR ALL TO authenticated
USING (public.has_module_permission('inventory', TRUE))
WITH CHECK (public.has_module_permission('inventory', TRUE));

DROP POLICY IF EXISTS inventory_items_select ON public.inventory_items;
CREATE POLICY inventory_items_select ON public.inventory_items
FOR SELECT TO authenticated
USING (public.has_module_permission('inventory', FALSE));

DROP POLICY IF EXISTS inventory_items_write ON public.inventory_items;
CREATE POLICY inventory_items_write ON public.inventory_items
FOR ALL TO authenticated
USING (public.has_module_permission('inventory', TRUE))
WITH CHECK (public.has_module_permission('inventory', TRUE));

-- Stock is readable directly but modified only through privileged RPCs.
DROP POLICY IF EXISTS warehouse_stock_select ON public.warehouse_stock;
CREATE POLICY warehouse_stock_select ON public.warehouse_stock
FOR SELECT TO authenticated
USING (public.has_module_permission('inventory', FALSE));

DROP POLICY IF EXISTS inventory_logs_select ON public.inventory_activity_logs;
CREATE POLICY inventory_logs_select ON public.inventory_activity_logs
FOR SELECT TO authenticated
USING (public.has_module_permission('inventory', FALSE));

DROP POLICY IF EXISTS transfers_select ON public.warehouse_transfers;
CREATE POLICY transfers_select ON public.warehouse_transfers
FOR SELECT TO authenticated
USING (public.has_module_permission('inventory', FALSE));

-- Orders.
DROP POLICY IF EXISTS orders_select ON public.orders;
CREATE POLICY orders_select ON public.orders
FOR SELECT TO authenticated
USING (public.has_module_permission('orders', FALSE));

DROP POLICY IF EXISTS orders_write ON public.orders;
CREATE POLICY orders_write ON public.orders
FOR ALL TO authenticated
USING (public.has_module_permission('orders', TRUE))
WITH CHECK (public.has_module_permission('orders', TRUE));

DROP POLICY IF EXISTS order_inventory_select ON public.order_inventory;
CREATE POLICY order_inventory_select ON public.order_inventory
FOR SELECT TO authenticated
USING (public.has_module_permission('orders', FALSE));

DROP POLICY IF EXISTS order_notes_select ON public.order_notes;
CREATE POLICY order_notes_select ON public.order_notes
FOR SELECT TO authenticated
USING (public.has_module_permission('orders', FALSE));

DROP POLICY IF EXISTS order_notes_insert ON public.order_notes;
CREATE POLICY order_notes_insert ON public.order_notes
FOR INSERT TO authenticated
WITH CHECK (
    public.has_module_permission('orders', TRUE)
    AND created_by = (SELECT auth.uid())
);

DROP POLICY IF EXISTS order_activity_select ON public.order_activity_logs;
CREATE POLICY order_activity_select ON public.order_activity_logs
FOR SELECT TO authenticated
USING (public.has_module_permission('orders', FALSE));

-- ------------------------------------------------------------
-- 20. RPC EXECUTION PERMISSIONS
-- ------------------------------------------------------------

REVOKE ALL ON FUNCTION public.adjust_inventory(UUID, UUID, public.inventory_activity_type, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_inventory(UUID, UUID, public.inventory_activity_type, NUMERIC, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.transfer_inventory(UUID, UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_inventory(UUID, UUID, UUID, NUMERIC, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.reserve_order_inventory(UUID, UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_order_inventory(UUID, UUID, UUID, NUMERIC) TO authenticated;

REVOKE ALL ON FUNCTION public.change_order_status(UUID, public.order_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_order_status(UUID, public.order_status) TO authenticated;

REVOKE ALL ON FUNCTION public.record_salary_payment(UUID, NUMERIC, DATE, public.payment_method, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_salary_payment(UUID, NUMERIC, DATE, public.payment_method, TEXT, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- 21. INITIAL ROLES AND PERMISSIONS
-- ------------------------------------------------------------

INSERT INTO public.roles(name, description)
VALUES
    ('Admin', 'Full system access'),
    ('Inventory Manager', 'Manages inventory and warehouses'),
    ('HR Manager', 'Manages employees and payroll'),
    ('Sales Manager', 'Manages customer orders')
ON CONFLICT (name) DO NOTHING;

-- Admin: all modules read/write.
INSERT INTO public.role_permissions(role_id, module, can_read, can_write)
SELECT r.id, m.module, TRUE, TRUE
FROM public.roles r
CROSS JOIN (
    VALUES
        ('users'::public.module_name),
        ('orders'::public.module_name),
        ('employees'::public.module_name),
        ('inventory'::public.module_name)
) AS m(module)
WHERE r.name = 'Admin'
ON CONFLICT (role_id, module)
DO UPDATE SET can_read = EXCLUDED.can_read, can_write = EXCLUDED.can_write;

-- Inventory Manager.
INSERT INTO public.role_permissions(role_id, module, can_read, can_write)
SELECT r.id, m.module, TRUE, m.can_write
FROM public.roles r
CROSS JOIN (
    VALUES
        ('users'::public.module_name, FALSE),
        ('orders'::public.module_name, FALSE),
        ('employees'::public.module_name, FALSE),
        ('inventory'::public.module_name, TRUE)
) AS m(module, can_write)
WHERE r.name = 'Inventory Manager'
ON CONFLICT (role_id, module)
DO UPDATE SET can_read = EXCLUDED.can_read, can_write = EXCLUDED.can_write;

-- HR Manager.
INSERT INTO public.role_permissions(role_id, module, can_read, can_write)
SELECT r.id, m.module, TRUE, m.can_write
FROM public.roles r
CROSS JOIN (
    VALUES
        ('users'::public.module_name, FALSE),
        ('orders'::public.module_name, FALSE),
        ('employees'::public.module_name, TRUE),
        ('inventory'::public.module_name, FALSE)
) AS m(module, can_write)
WHERE r.name = 'HR Manager'
ON CONFLICT (role_id, module)
DO UPDATE SET can_read = EXCLUDED.can_read, can_write = EXCLUDED.can_write;

-- Sales Manager.
INSERT INTO public.role_permissions(role_id, module, can_read, can_write)
SELECT r.id, m.module, TRUE, m.can_write
FROM public.roles r
CROSS JOIN (
    VALUES
        ('users'::public.module_name, FALSE),
        ('orders'::public.module_name, TRUE),
        ('employees'::public.module_name, FALSE),
        ('inventory'::public.module_name, FALSE)
) AS m(module, can_write)
WHERE r.name = 'Sales Manager'
ON CONFLICT (role_id, module)
DO UPDATE SET can_read = EXCLUDED.can_read, can_write = EXCLUDED.can_write;

COMMIT;
