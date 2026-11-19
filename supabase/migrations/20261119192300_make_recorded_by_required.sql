-- Make recorded_by required in salary_payments table
BEGIN;

-- First, update any NULL recorded_by values to a default system user
-- This assumes there's an admin user or we'll use a placeholder
-- In production, you might want to handle this differently

-- For salary_payments
UPDATE public.salary_payments
SET recorded_by = (
  SELECT id FROM public.profiles WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Admin' LIMIT 1) LIMIT 1
)
WHERE recorded_by IS NULL;

-- Now alter the column to be NOT NULL
ALTER TABLE public.salary_payments
  ALTER COLUMN recorded_by SET NOT NULL,
  ALTER COLUMN recorded_by DROP DEFAULT;

-- Change ON DELETE behavior from SET NULL to RESTRICT
-- This ensures we can't delete a user who has recorded salary payments
ALTER TABLE public.salary_payments
  DROP CONSTRAINT salary_payments_recorded_by_fkey,
  ADD CONSTRAINT salary_payments_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

COMMIT;
