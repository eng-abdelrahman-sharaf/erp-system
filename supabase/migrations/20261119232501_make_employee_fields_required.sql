-- Make employee email, phone, address, position required
BEGIN;

-- First, update any NULL values to default placeholders
-- In production, you might want to handle this differently by requiring users to fill in missing data

UPDATE public.employees
SET email = COALESCE(email, 'employee.' || id || '@company.com')
WHERE email IS NULL;

UPDATE public.employees
SET phone = COALESCE(phone, '+1-555-0100')
WHERE phone IS NULL;

UPDATE public.employees
SET address = COALESCE(address, '123 Business Avenue, Suite 100, New York, NY 10001')
WHERE address IS NULL;

UPDATE public.employees
SET position = COALESCE(position, 'Staff Member')
WHERE position IS NULL;

-- Now alter the columns to be NOT NULL
ALTER TABLE public.employees
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN address SET NOT NULL,
  ALTER COLUMN position SET NOT NULL;

COMMIT;
