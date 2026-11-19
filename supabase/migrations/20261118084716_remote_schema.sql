SET local check_function_bodies = off;

CREATE TABLE "public"."employees" (
  "id"              uuid                   NOT NULL DEFAULT gen_random_uuid(),
  "full_name"       character varying(255) NOT NULL,
  "email"           character varying(255),
  "phone"           character varying(50),
  "address"         text,
  "position"        character varying(150),
  "salary"          numeric(14,2)          NOT NULL DEFAULT 0,
  "employment_date" date                   NOT NULL,
  CONSTRAINT "employees_email_key" UNIQUE (email),
  CONSTRAINT "employees_pkey" PRIMARY KEY (id),
  CONSTRAINT "employees_salary_check" CHECK ((salary >= (0)::numeric))
);

ALTER TABLE "public"."employees"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."inventory_activity_logs" (
  "id"           uuid NOT NULL DEFAULT gen_random_uuid(),
  "item_id"      uuid NOT NULL,
  "warehouse_id" uuid NOT NULL,
  CONSTRAINT "inventory_activity_logs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."inventory_activity_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."inventory_items" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        character varying(255)   NOT NULL,
  "sku"         character varying(100)   NOT NULL,
  "description" text,
  "unit"        character varying(50)    NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "inventory_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "inventory_items_sku_key" UNIQUE (sku)
);

ALTER TABLE "public"."inventory_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."order_activity_logs" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"      uuid                     NOT NULL,
  "activity_type" character varying(100)   NOT NULL,
  "description"   text                     NOT NULL,
  "performed_by"  uuid,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_activity_logs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."order_activity_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."order_inventory" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"     uuid                     NOT NULL,
  "item_id"      uuid                     NOT NULL,
  "warehouse_id" uuid                     NOT NULL,
  "quantity"     numeric(14,2)            NOT NULL,
  "unit"         character varying(50)    NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_inventory_order_id_item_id_warehouse_id_key" UNIQUE (order_id, item_id, warehouse_id),
  CONSTRAINT "order_inventory_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_inventory_quantity_check" CHECK ((quantity > (0)::numeric))
);

ALTER TABLE "public"."order_inventory"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."order_notes" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"   uuid                     NOT NULL,
  "content"    text                     NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_notes_content_check" CHECK ((length(TRIM(BOTH FROM content)) > 0)),
  CONSTRAINT "order_notes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."order_notes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."orders" (
  "id"             uuid                   NOT NULL DEFAULT gen_random_uuid(),
  "order_number"   character varying(100) NOT NULL,
  "title"          character varying(255) NOT NULL,
  "description"    text,
  "client_name"    character varying(255) NOT NULL,
  "client_phone"   character varying(50),
  "client_address" text,
  "employee_id"    uuid,
  CONSTRAINT "orders_order_number_key" UNIQUE (order_number),
  CONSTRAINT "orders_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."orders"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."payroll_periods" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "employee_id"   uuid                     NOT NULL,
  "period_start"  date                     NOT NULL,
  "period_end"    date                     NOT NULL,
  "salary_amount" numeric(14,2)            NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "payroll_periods_check" CHECK ((period_end >= period_start)),
  CONSTRAINT "payroll_periods_employee_id_period_start_period_end_key" UNIQUE (employee_id, period_start, period_end),
  CONSTRAINT "payroll_periods_pkey" PRIMARY KEY (id),
  CONSTRAINT "payroll_periods_salary_amount_check" CHECK ((salary_amount >= (0)::numeric))
);

ALTER TABLE "public"."payroll_periods"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"        uuid                   NOT NULL,
  "full_name" character varying(255) NOT NULL,
  "email"     character varying(255) NOT NULL,
  "role_id"   uuid                   NOT NULL,
  CONSTRAINT "profiles_email_key" UNIQUE (email),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."role_permissions" (
  "id"      uuid NOT NULL DEFAULT gen_random_uuid(),
  "role_id" uuid NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."role_permissions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."roles" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        character varying(100)   NOT NULL,
  "description" text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "roles_name_key" UNIQUE (name),
  CONSTRAINT "roles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."roles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."salary_payments" (
  "id"                uuid          NOT NULL DEFAULT gen_random_uuid(),
  "payroll_period_id" uuid          NOT NULL,
  "amount"            numeric(14,2) NOT NULL,
  "payment_date"      date          NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT "salary_payments_amount_check" CHECK ((amount > (0)::numeric)),
  CONSTRAINT "salary_payments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."salary_payments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."warehouse_stock" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "item_id"            uuid                     NOT NULL,
  "warehouse_id"       uuid                     NOT NULL,
  "total_quantity"     numeric(14,2)            NOT NULL DEFAULT 0,
  "reserved_quantity"  numeric(14,2)            NOT NULL DEFAULT 0,
  "used_quantity"      numeric(14,2)            NOT NULL DEFAULT 0,
  "available_quantity" numeric(14,2)            GENERATED ALWAYS AS (((total_quantity - reserved_quantity) - used_quantity)) STORED,
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "warehouse_stock_check" CHECK ((total_quantity >= (reserved_quantity + used_quantity))),
  CONSTRAINT "warehouse_stock_item_id_warehouse_id_key" UNIQUE (item_id, warehouse_id),
  CONSTRAINT "warehouse_stock_pkey" PRIMARY KEY (id),
  CONSTRAINT "warehouse_stock_reserved_quantity_check" CHECK ((reserved_quantity >= (0)::numeric)),
  CONSTRAINT "warehouse_stock_total_quantity_check" CHECK ((total_quantity >= (0)::numeric)),
  CONSTRAINT "warehouse_stock_used_quantity_check" CHECK ((used_quantity >= (0)::numeric))
);

ALTER TABLE "public"."warehouse_stock"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."warehouse_transfers" (
  "id"                       uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "item_id"                  uuid                     NOT NULL,
  "source_warehouse_id"      uuid                     NOT NULL,
  "destination_warehouse_id" uuid                     NOT NULL,
  "quantity"                 numeric(14,2)            NOT NULL,
  "transfer_date"            timestamp with time zone NOT NULL DEFAULT now(),
  "notes"                    text,
  "performed_by"             uuid,
  "created_at"               timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "warehouse_transfers_check" CHECK ((source_warehouse_id <> destination_warehouse_id)),
  CONSTRAINT "warehouse_transfers_pkey" PRIMARY KEY (id),
  CONSTRAINT "warehouse_transfers_quantity_check" CHECK ((quantity > (0)::numeric))
);

ALTER TABLE "public"."warehouse_transfers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."warehouses" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        character varying(255)   NOT NULL,
  "address"     text,
  "description" text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "warehouses_name_key" UNIQUE (name),
  CONSTRAINT "warehouses_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."warehouses"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."account_status" AS ENUM (
  'active',
  'inactive'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "status" public.account_status NOT NULL DEFAULT 'active'::public.account_status;

ALTER TABLE "public"."profiles"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

CREATE TYPE "public"."employment_status" AS ENUM (
  'active',
  'inactive'
);

ALTER TABLE "public"."employees"
  ADD COLUMN "status" public.employment_status NOT NULL DEFAULT 'active'::public.employment_status;

ALTER TABLE "public"."employees"
  ADD COLUMN "notes" text;

ALTER TABLE "public"."employees"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."employees"
  ADD COLUMN "updated_at" timestamp WITH time zone NOT NULL DEFAULT now();

CREATE TYPE "public"."inventory_activity_type" AS ENUM (
  'addition',
  'manual_usage',
  'reservation',
  'release',
  'consumption',
  'transfer_out',
  'transfer_in'
);

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "activity_type" public.inventory_activity_type NOT NULL;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "quantity" numeric(14,2) NOT NULL;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "previous_total" numeric(14,2) NOT NULL;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "new_total" numeric(14,2) NOT NULL;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "previous_reserved" numeric(14,2) NOT NULL;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "new_reserved" numeric(14,2) NOT NULL;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "previous_used" numeric(14,2) NOT NULL;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "new_used" numeric(14,2) NOT NULL;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "related_order_id" uuid;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "transfer_id" uuid;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "performed_by" uuid;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "notes" text;

ALTER TABLE "public"."inventory_activity_logs"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

CREATE TYPE "public"."module_name" AS ENUM (
  'users',
  'orders',
  'employees',
  'inventory'
);

ALTER TABLE "public"."role_permissions"
  ADD COLUMN "module" public.module_name NOT NULL;

ALTER TABLE "public"."role_permissions"
  ADD COLUMN "can_read" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."role_permissions"
  ADD COLUMN "can_write" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."role_permissions"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

CREATE TYPE "public"."order_status" AS ENUM (
  'pending',
  'in_progress',
  'paid',
  'cancelled'
);

ALTER TABLE "public"."orders"
  ADD COLUMN "status" public.order_status NOT NULL DEFAULT 'pending'::public.order_status;

ALTER TABLE "public"."orders"
  ADD COLUMN "order_date" date NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE "public"."orders"
  ADD COLUMN "notes" text;

ALTER TABLE "public"."orders"
  ADD COLUMN "created_by" uuid;

ALTER TABLE "public"."orders"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

ALTER TABLE "public"."orders"
  ADD COLUMN "updated_at" timestamp WITH time zone NOT NULL DEFAULT now();

CREATE TYPE "public"."payment_method" AS ENUM (
  'cash',
  'bank_transfer',
  'instapay',
  'check',
  'other'
);

ALTER TABLE "public"."salary_payments"
  ADD COLUMN "method" public.payment_method NOT NULL;

ALTER TABLE "public"."salary_payments"
  ADD COLUMN "reference_number" character varying(255);

ALTER TABLE "public"."salary_payments"
  ADD COLUMN "notes" text;

ALTER TABLE "public"."salary_payments"
  ADD COLUMN "recorded_by" uuid;

ALTER TABLE "public"."salary_payments"
  ADD COLUMN "created_at" timestamp WITH time zone NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.adjust_inventory (
  p_item_id      uuid,
  p_warehouse_id uuid,
  p_activity     public.inventory_activity_type,
  p_quantity     numeric,
  p_notes        text                           DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.change_order_status (
  p_order_id   uuid,
  p_new_status public.order_status
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
DECLARE
    v_user UUID := auth.uid();
    v_order public.orders%ROWTYPE;
    v_assignment RECORD;
    v_stock public.warehouse_stock%ROWTYPE;
    v_activity public.inventory_activity_type;
BEGIN
    IF p_new_status NOT IN ('paid', 'cancelled') THEN
        RAISE EXCEPTION 'This RPC only finalizes orders as paid or cancelled';
    END IF;

    IF NOT public.has_module_permission('orders', TRUE)
       OR NOT public.has_module_permission('inventory', TRUE) THEN
        RAISE EXCEPTION 'Insufficient orders or inventory permissions';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status NOT IN ('pending', 'in_progress') THEN
        RAISE EXCEPTION 'Order has already been finalized';
    END IF;

    v_activity := CASE
        WHEN p_new_status = 'paid' THEN 'consumption'::public.inventory_activity_type
        ELSE 'release'::public.inventory_activity_type
    END;

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

        IF p_new_status = 'paid' THEN
            UPDATE public.warehouse_stock
            SET reserved_quantity = reserved_quantity - v_assignment.quantity,
                used_quantity = used_quantity + v_assignment.quantity
            WHERE id = v_stock.id;
        ELSE
            UPDATE public.warehouse_stock
            SET reserved_quantity = reserved_quantity - v_assignment.quantity
            WHERE id = v_stock.id;
        END IF;

        INSERT INTO public.inventory_activity_logs(
            item_id, warehouse_id, activity_type, quantity,
            previous_total, new_total,
            previous_reserved, new_reserved,
            previous_used, new_used,
            related_order_id, performed_by
        )
        VALUES (
            v_assignment.item_id, v_assignment.warehouse_id, v_activity, v_assignment.quantity,
            v_stock.total_quantity, v_stock.total_quantity,
            v_stock.reserved_quantity, v_stock.reserved_quantity - v_assignment.quantity,
            v_stock.used_quantity,
            CASE WHEN p_new_status = 'paid'
                THEN v_stock.used_quantity + v_assignment.quantity
                ELSE v_stock.used_quantity
            END,
            p_order_id, v_user
        );
    END LOOP;

    -- The trigger validates that this status change came through this RPC
    -- and automatically inserts the corresponding order activity log.
    PERFORM set_config('app.allow_order_status_change', 'true', TRUE);

    UPDATE public.orders
    SET status = p_new_status
    WHERE id = p_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_module_permission (
  p_module public.module_name,
  p_write  boolean            DEFAULT false
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_order_changes()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_order_note()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
BEGIN
    INSERT INTO public.order_activity_logs(order_id, activity_type, description, performed_by)
    VALUES (NEW.order_id, 'note_added', 'Order note added', NEW.created_by);
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable; updates and deletes are prohibited';
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_salary_payment (
  p_payroll_period_id uuid,
  p_amount            numeric,
  p_payment_date      date,
  p_method            public.payment_method,
  p_reference_number  text                  DEFAULT NULL::text,
  p_notes             text                  DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.reserve_order_inventory (
  p_order_id     uuid,
  p_item_id      uuid,
  p_warehouse_id uuid,
  p_quantity     numeric
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.transfer_inventory (
  p_item_id                  uuid,
  p_source_warehouse_id      uuid,
  p_destination_warehouse_id uuid,
  p_quantity                 numeric,
  p_notes                    text    DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.validate_order_employee()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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
$function$;

ALTER TABLE "public"."inventory_activity_logs"
  ADD CONSTRAINT "inventory_activity_logs_quantity_check" CHECK ((quantity > (0)::numeric));

ALTER TABLE "public"."inventory_activity_logs"
  ADD CONSTRAINT "inventory_activity_logs_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_inventory"
  ADD CONSTRAINT "order_inventory_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_activity_logs"
  ADD CONSTRAINT "inventory_activity_logs_related_order_id_fkey" FOREIGN KEY (related_order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_activity_logs"
  ADD CONSTRAINT "order_activity_logs_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_inventory"
  ADD CONSTRAINT "order_inventory_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_notes"
  ADD CONSTRAINT "order_notes_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

ALTER TABLE "public"."payroll_periods"
  ADD CONSTRAINT "payroll_periods_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."inventory_activity_logs"
  ADD CONSTRAINT "inventory_activity_logs_performed_by_fkey" FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."order_activity_logs"
  ADD CONSTRAINT "order_activity_logs_performed_by_fkey" FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."order_notes"
  ADD CONSTRAINT "order_notes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."role_permissions"
  ADD CONSTRAINT "role_permissions_check" CHECK (((NOT can_write) OR can_read));

ALTER TABLE "public"."role_permissions"
  ADD CONSTRAINT "role_permissions_role_id_module_key" UNIQUE (role_id, module);

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."role_permissions"
  ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;

ALTER TABLE "public"."salary_payments"
  ADD CONSTRAINT "salary_payments_payroll_period_id_fkey" FOREIGN KEY (payroll_period_id) REFERENCES public.payroll_periods(id) ON DELETE RESTRICT;

ALTER TABLE "public"."salary_payments"
  ADD CONSTRAINT "salary_payments_recorded_by_fkey" FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."warehouse_stock"
  ADD CONSTRAINT "warehouse_stock_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."warehouse_transfers"
  ADD CONSTRAINT "warehouse_transfers_item_id_fkey" FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;

ALTER TABLE "public"."warehouse_transfers"
  ADD CONSTRAINT "warehouse_transfers_performed_by_fkey" FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."inventory_activity_logs"
  ADD CONSTRAINT "inventory_activity_logs_transfer_id_fkey" FOREIGN KEY (transfer_id) REFERENCES public.warehouse_transfers(id) ON DELETE RESTRICT;

ALTER TABLE "public"."inventory_activity_logs"
  ADD CONSTRAINT "inventory_activity_logs_warehouse_id_fkey" FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;

ALTER TABLE "public"."order_inventory"
  ADD CONSTRAINT "order_inventory_warehouse_id_fkey" FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;

ALTER TABLE "public"."warehouse_stock"
  ADD CONSTRAINT "warehouse_stock_warehouse_id_fkey" FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;

ALTER TABLE "public"."warehouse_transfers"
  ADD CONSTRAINT "warehouse_transfers_destination_warehouse_id_fkey" FOREIGN KEY (destination_warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;

ALTER TABLE "public"."warehouse_transfers"
  ADD CONSTRAINT "warehouse_transfers_source_warehouse_id_fkey" FOREIGN KEY (source_warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;

CREATE VIEW "public"."inventory_summary" WITH (security_invoker=true) AS  SELECT i.id AS item_id,
    i.name AS item_name,
    i.sku,
    i.unit,
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    COALESCE(ws.total_quantity, (0)::numeric) AS total_quantity,
    COALESCE(ws.available_quantity, (0)::numeric) AS available_quantity,
    COALESCE(ws.reserved_quantity, (0)::numeric) AS reserved_quantity,
    COALESCE(ws.used_quantity, (0)::numeric) AS used_quantity
   FROM ((public.inventory_items i
     CROSS JOIN public.warehouses w)
     LEFT JOIN public.warehouse_stock ws ON (((ws.item_id = i.id) AND (ws.warehouse_id = w.id))));

CREATE VIEW "public"."order_summary" WITH (security_invoker=true) AS  SELECT o.id,
    o.order_number,
    o.title,
    o.client_name,
    o.client_phone,
    o.client_address,
    o.status,
    o.order_date,
    o.employee_id,
    e.full_name AS employee_name,
    count(DISTINCT oi.id) AS inventory_items_count,
    COALESCE(sum(oi.quantity), (0)::numeric) AS total_inventory_quantity
   FROM ((public.orders o
     LEFT JOIN public.employees e ON ((e.id = o.employee_id)))
     LEFT JOIN public.order_inventory oi ON ((oi.order_id = o.id)))
  GROUP BY o.id, e.full_name;

CREATE VIEW "public"."payroll_summary" WITH (security_invoker=true) AS  SELECT pp.id AS payroll_period_id,
    pp.employee_id,
    e.full_name AS employee_name,
    pp.period_start,
    pp.period_end,
    pp.salary_amount,
    (COALESCE(sum(sp.amount), (0)::numeric))::numeric(14,2) AS total_paid,
    ((pp.salary_amount - COALESCE(sum(sp.amount), (0)::numeric)))::numeric(14,2) AS outstanding
   FROM ((public.payroll_periods pp
     JOIN public.employees e ON ((e.id = pp.employee_id)))
     LEFT JOIN public.salary_payments sp ON ((sp.payroll_period_id = pp.id)))
  GROUP BY pp.id, pp.employee_id, e.full_name, pp.period_start, pp.period_end, pp.salary_amount;

CREATE INDEX idx_employees_name ON public.employees USING btree (full_name);

CREATE INDEX idx_employees_status ON public.employees USING btree (status);

CREATE INDEX idx_inventory_items_name ON public.inventory_items USING btree (name);

CREATE INDEX idx_inventory_logs_created_at ON public.inventory_activity_logs USING btree (created_at);

CREATE INDEX idx_inventory_logs_item ON public.inventory_activity_logs USING btree (item_id);

CREATE INDEX idx_inventory_logs_warehouse ON public.inventory_activity_logs USING btree (warehouse_id);

CREATE INDEX idx_order_activity_order ON public.order_activity_logs USING btree (order_id);

CREATE INDEX idx_order_inventory_order ON public.order_inventory USING btree (order_id);

CREATE INDEX idx_order_notes_order ON public.order_notes USING btree (order_id);

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);

CREATE INDEX idx_orders_date ON public.orders USING btree (order_date);

CREATE INDEX idx_orders_employee ON public.orders USING btree (employee_id);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_payroll_employee ON public.payroll_periods USING btree (employee_id);

CREATE INDEX idx_profiles_role_id ON public.profiles USING btree (role_id);

CREATE INDEX idx_profiles_status ON public.profiles USING btree (status);

CREATE INDEX idx_salary_payments_date ON public.salary_payments USING btree (payment_date);

CREATE INDEX idx_salary_payments_period ON public.salary_payments USING btree (payroll_period_id);

CREATE INDEX idx_transfers_date ON public.warehouse_transfers USING btree (transfer_date);

CREATE INDEX idx_warehouse_stock_warehouse ON public.warehouse_stock USING btree (warehouse_id);

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_immutable_inventory_logs
  BEFORE DELETE OR UPDATE ON public.inventory_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();

CREATE TRIGGER trg_immutable_order_logs
  BEFORE DELETE OR UPDATE ON public.order_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();

CREATE TRIGGER trg_log_order_note
  AFTER INSERT ON public.order_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_note();

CREATE TRIGGER trg_log_order_changes
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_changes();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_validate_order_employee
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_employee();

CREATE TRIGGER trg_warehouse_stock_updated_at
  BEFORE UPDATE ON public.warehouse_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "employees_select" ON "public"."employees"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('employees'::public.module_name, false));

CREATE POLICY "employees_write" ON "public"."employees"
  FOR ALL
  TO "authenticated"
  USING (public.has_module_permission('employees'::public.module_name, true))
  WITH CHECK (public.has_module_permission('employees'::public.module_name, true));

CREATE POLICY "inventory_logs_select" ON "public"."inventory_activity_logs"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('inventory'::public.module_name, false));

CREATE POLICY "inventory_items_select" ON "public"."inventory_items"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('inventory'::public.module_name, false));

CREATE POLICY "inventory_items_write" ON "public"."inventory_items"
  FOR ALL
  TO "authenticated"
  USING (public.has_module_permission('inventory'::public.module_name, true))
  WITH CHECK (public.has_module_permission('inventory'::public.module_name, true));

CREATE POLICY "order_activity_select" ON "public"."order_activity_logs"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('orders'::public.module_name, false));

CREATE POLICY "order_inventory_select" ON "public"."order_inventory"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('orders'::public.module_name, false));

CREATE POLICY "order_notes_insert" ON "public"."order_notes"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.has_module_permission('orders'::public.module_name, true) AND (created_by = ( SELECT auth.uid() AS uid))));

CREATE POLICY "order_notes_select" ON "public"."order_notes"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('orders'::public.module_name, false));

CREATE POLICY "orders_select" ON "public"."orders"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('orders'::public.module_name, false));

CREATE POLICY "orders_write" ON "public"."orders"
  FOR ALL
  TO "authenticated"
  USING (public.has_module_permission('orders'::public.module_name, true))
  WITH CHECK (public.has_module_permission('orders'::public.module_name, true));

CREATE POLICY "payroll_periods_select" ON "public"."payroll_periods"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('employees'::public.module_name, false));

CREATE POLICY "payroll_periods_write" ON "public"."payroll_periods"
  FOR ALL
  TO "authenticated"
  USING (public.has_module_permission('employees'::public.module_name, true))
  WITH CHECK (public.has_module_permission('employees'::public.module_name, true));

CREATE POLICY "profiles_delete" ON "public"."profiles"
  FOR DELETE
  TO "authenticated"
  USING (public.has_module_permission('users'::public.module_name, true));

CREATE POLICY "profiles_insert" ON "public"."profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.has_module_permission('users'::public.module_name, true));

CREATE POLICY "profiles_select" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (((id = ( SELECT auth.uid() AS uid)) OR public.has_module_permission('users'::public.module_name, false)));

CREATE POLICY "profiles_update" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_module_permission('users'::public.module_name, true))
  WITH CHECK (public.has_module_permission('users'::public.module_name, true));

CREATE POLICY "role_permissions_select" ON "public"."role_permissions"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('users'::public.module_name, false));

CREATE POLICY "role_permissions_write" ON "public"."role_permissions"
  FOR ALL
  TO "authenticated"
  USING (public.has_module_permission('users'::public.module_name, true))
  WITH CHECK (public.has_module_permission('users'::public.module_name, true));

CREATE POLICY "roles_select" ON "public"."roles"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('users'::public.module_name, false));

CREATE POLICY "roles_write" ON "public"."roles"
  FOR ALL
  TO "authenticated"
  USING (public.has_module_permission('users'::public.module_name, true))
  WITH CHECK (public.has_module_permission('users'::public.module_name, true));

CREATE POLICY "salary_payments_insert" ON "public"."salary_payments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.has_module_permission('employees'::public.module_name, true) AND (recorded_by = ( SELECT auth.uid() AS uid))));

CREATE POLICY "salary_payments_select" ON "public"."salary_payments"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('employees'::public.module_name, false));

CREATE POLICY "warehouse_stock_select" ON "public"."warehouse_stock"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('inventory'::public.module_name, false));

CREATE POLICY "transfers_select" ON "public"."warehouse_transfers"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('inventory'::public.module_name, false));

CREATE POLICY "warehouses_select" ON "public"."warehouses"
  FOR SELECT
  TO "authenticated"
  USING (public.has_module_permission('inventory'::public.module_name, false));

CREATE POLICY "warehouses_write" ON "public"."warehouses"
  FOR ALL
  TO "authenticated"
  USING (public.has_module_permission('inventory'::public.module_name, true))
  WITH CHECK (public.has_module_permission('inventory'::public.module_name, true));

REVOKE ALL ON FUNCTION "public"."adjust_inventory"(uuid, uuid, public.inventory_activity_type, numeric, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."adjust_inventory"(uuid, uuid, public.inventory_activity_type, numeric, text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."adjust_inventory"(uuid, uuid, public.inventory_activity_type, numeric, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."adjust_inventory"(uuid, uuid, public.inventory_activity_type, numeric, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."adjust_inventory"(uuid, uuid, public.inventory_activity_type, numeric, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."change_order_status"(uuid, public.order_status) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."change_order_status"(uuid, public.order_status) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."change_order_status"(uuid, public.order_status) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."change_order_status"(uuid, public.order_status) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."change_order_status"(uuid, public.order_status) TO "service_role";

REVOKE ALL ON FUNCTION "public"."has_module_permission"(public.module_name, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."has_module_permission"(public.module_name, boolean) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."has_module_permission"(public.module_name, boolean) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."has_module_permission"(public.module_name, boolean) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."has_module_permission"(public.module_name, boolean) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."log_order_changes"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."log_order_changes"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."log_order_changes"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."log_order_changes"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."log_order_note"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."log_order_note"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."log_order_note"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."log_order_note"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."prevent_audit_log_mutation"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."prevent_audit_log_mutation"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."prevent_audit_log_mutation"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."prevent_audit_log_mutation"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."record_salary_payment"(uuid, numeric, date, public.payment_method, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."record_salary_payment"(uuid, numeric, date, public.payment_method, text, text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."record_salary_payment"(uuid, numeric, date, public.payment_method, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."record_salary_payment"(uuid, numeric, date, public.payment_method, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."record_salary_payment"(uuid, numeric, date, public.payment_method, text, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."reserve_order_inventory"(uuid, uuid, uuid, numeric) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."reserve_order_inventory"(uuid, uuid, uuid, numeric) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."reserve_order_inventory"(uuid, uuid, uuid, numeric) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."reserve_order_inventory"(uuid, uuid, uuid, numeric) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."reserve_order_inventory"(uuid, uuid, uuid, numeric) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."transfer_inventory"(uuid, uuid, uuid, numeric, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."transfer_inventory"(uuid, uuid, uuid, numeric, text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."transfer_inventory"(uuid, uuid, uuid, numeric, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."transfer_inventory"(uuid, uuid, uuid, numeric, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."transfer_inventory"(uuid, uuid, uuid, numeric, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."validate_order_employee"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."validate_order_employee"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_order_employee"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_order_employee"() TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."employees" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."employees" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."employees" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."employees" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_activity_logs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."inventory_activity_logs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_activity_logs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_activity_logs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_items" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."inventory_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_items" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_items" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_activity_logs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."order_activity_logs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_activity_logs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_activity_logs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_inventory" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."order_inventory" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_inventory" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_inventory" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_notes" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."order_notes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_notes" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_notes" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."orders" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payroll_periods" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."payroll_periods" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payroll_periods" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payroll_periods" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."role_permissions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."role_permissions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."role_permissions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."role_permissions" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."roles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."roles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."roles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."roles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."salary_payments" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."salary_payments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."salary_payments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."salary_payments" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouse_stock" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."warehouse_stock" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouse_stock" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouse_stock" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouse_transfers" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."warehouse_transfers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouse_transfers" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouse_transfers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouses" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."warehouses" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouses" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."warehouses" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_summary" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."inventory_summary" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_summary" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inventory_summary" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_summary" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."order_summary" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_summary" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_summary" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payroll_summary" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."payroll_summary" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payroll_summary" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payroll_summary" TO "service_role";

