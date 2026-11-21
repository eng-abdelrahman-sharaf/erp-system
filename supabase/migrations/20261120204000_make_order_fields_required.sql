-- Make order client_phone, client_address, and created_by required
BEGIN;

-- 1. Ensure log_order_changes handles NULL auth.uid() safely
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
    IF v_actor IS NULL THEN
        v_actor := COALESCE(
            NEW.created_by,
            (SELECT id FROM public.profiles WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Admin' LIMIT 1) LIMIT 1),
            (SELECT id FROM public.profiles LIMIT 1)
        );
    END IF;

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

-- 2. Temporarily disable trg_log_order_changes so data migration backfill doesn't log false update activities
ALTER TABLE public.orders DISABLE TRIGGER trg_log_order_changes;

-- 3. Backfill any NULL client_phone values
UPDATE public.orders
SET client_phone = COALESCE(client_phone, '+1-555-0100')
WHERE client_phone IS NULL;

-- 4. Backfill any NULL client_address values
UPDATE public.orders
SET client_address = COALESCE(client_address, '123 Business Avenue, Suite 100, New York, NY 10001')
WHERE client_address IS NULL;

-- 5. Backfill any NULL created_by values using an admin profile or first profile
UPDATE public.orders
SET created_by = COALESCE(
  created_by,
  (SELECT id FROM public.profiles WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Admin' LIMIT 1) LIMIT 1),
  (SELECT id FROM public.profiles LIMIT 1)
)
WHERE created_by IS NULL;

-- 6. Re-enable trg_log_order_changes
ALTER TABLE public.orders ENABLE TRIGGER trg_log_order_changes;

-- 7. Alter columns to NOT NULL
ALTER TABLE public.orders
  ALTER COLUMN client_phone SET NOT NULL,
  ALTER COLUMN client_address SET NOT NULL,
  ALTER COLUMN created_by SET NOT NULL;

-- 8. Change ON DELETE behavior on created_by from SET NULL to RESTRICT
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_created_by_fkey,
  ADD CONSTRAINT orders_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

COMMIT;
