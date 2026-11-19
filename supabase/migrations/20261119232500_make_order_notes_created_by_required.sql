-- Make created_by required in order_notes table
BEGIN;

-- First, update any NULL created_by values to a default system user
-- This assumes there's an admin user or we'll use a placeholder
-- In production, you might want to handle this differently

-- For order_notes
UPDATE public.order_notes
SET created_by = (
  SELECT id FROM public.profiles WHERE role_id = (SELECT id FROM public.roles WHERE name = 'Admin' LIMIT 1) LIMIT 1
)
WHERE created_by IS NULL;

-- Now alter the column to be NOT NULL
ALTER TABLE public.order_notes
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN created_by DROP DEFAULT;

-- Change ON DELETE behavior from SET NULL to RESTRICT
-- This ensures we can't delete a user who has created order notes
ALTER TABLE public.order_notes
  DROP CONSTRAINT order_notes_created_by_fkey,
  ADD CONSTRAINT order_notes_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

COMMIT;
