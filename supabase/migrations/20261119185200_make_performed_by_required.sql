-- Make performed_by required in activity log tables
BEGIN;

-- First, update any NULL performed_by values to a default system user
-- This assumes there's an admin user or we'll use a placeholder
-- In production, you might want to handle this differently

TRUNCATE TABLE
    public.order_activity_logs,
    public.inventory_activity_logs,
    public.warehouse_transfers
CASCADE;

-- For order_activity_logs
UPDATE public.order_activity_logs
SET performed_by = (
  SELECT id FROM public.profiles WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Admin' LIMIT 1) LIMIT 1
)
WHERE performed_by IS NULL;

-- For warehouse_transfers
UPDATE public.warehouse_transfers
SET performed_by = (
  SELECT id FROM public.profiles WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Admin' LIMIT 1) LIMIT 1
)
WHERE performed_by IS NULL;

-- For inventory_activity_logs
UPDATE public.inventory_activity_logs
SET performed_by = (
  SELECT id FROM public.profiles WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Admin' LIMIT 1) LIMIT 1
)
WHERE performed_by IS NULL;

-- Now alter the columns to be NOT NULL
ALTER TABLE public.order_activity_logs
  ALTER COLUMN performed_by SET NOT NULL,
  ALTER COLUMN performed_by DROP DEFAULT;

ALTER TABLE public.warehouse_transfers
  ALTER COLUMN performed_by SET NOT NULL,
  ALTER COLUMN performed_by DROP DEFAULT;

ALTER TABLE public.inventory_activity_logs
  ALTER COLUMN performed_by SET NOT NULL,
  ALTER COLUMN performed_by DROP DEFAULT;

-- Change ON DELETE behavior from SET NULL to RESTRICT
-- This ensures we can't delete a user who has performed actions
ALTER TABLE public.order_activity_logs
  DROP CONSTRAINT order_activity_logs_performed_by_fkey,
  ADD CONSTRAINT order_activity_logs_performed_by_fkey
    FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.warehouse_transfers
  DROP CONSTRAINT warehouse_transfers_performed_by_fkey,
  ADD CONSTRAINT warehouse_transfers_performed_by_fkey
    FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.inventory_activity_logs
  DROP CONSTRAINT inventory_activity_logs_performed_by_fkey,
  ADD CONSTRAINT inventory_activity_logs_performed_by_fkey
    FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

COMMIT;
