-- Make warehouse address required
BEGIN;

-- First, update any NULL address values to a default placeholder
-- In production, you might want to handle this differently by requiring users to fill in missing data

UPDATE public.warehouses
SET address = COALESCE(address, '456 Industrial Park Drive, Los Angeles, CA 90001')
WHERE address IS NULL;

-- Now alter the column to be NOT NULL
ALTER TABLE public.warehouses
  ALTER COLUMN address SET NOT NULL;

COMMIT;
