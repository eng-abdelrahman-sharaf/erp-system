
BEGIN;

-- 1. Prevent deleting or renaming the Admin role.
CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF OLD.name = 'Admin' THEN
        RAISE EXCEPTION 'The Admin role cannot be deleted or renamed';
    END IF;

    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_protect_admin_role
BEFORE DELETE OR UPDATE OF name ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_role();


-- 2. Enforce permission rules.
CREATE OR REPLACE FUNCTION public.validate_role_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_role_name VARCHAR(100);
BEGIN
    SELECT name
    INTO v_role_name
    FROM public.roles
    WHERE id = NEW.role_id;

    -- Non-admin roles cannot write to the users module.
    IF NEW.module = 'users'
       AND NEW.can_write = TRUE
       AND v_role_name IS DISTINCT FROM 'Admin' THEN
        RAISE EXCEPTION
            'Only the Admin role can have write permissions for the users module';
    END IF;

    -- Admin must retain full permissions.
    IF v_role_name = 'Admin'
       AND (NEW.can_read = FALSE OR NEW.can_write = FALSE) THEN
        RAISE EXCEPTION
            'The Admin role must have full read and write permissions';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_role_permissions
BEFORE INSERT OR UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.validate_role_permissions();


-- 3. Prevent deleting Admin permissions.
CREATE OR REPLACE FUNCTION public.protect_admin_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.roles
        WHERE id = OLD.role_id
          AND name = 'Admin'
    ) THEN
        RAISE EXCEPTION 'Admin permissions cannot be deleted';
    END IF;

    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_protect_admin_permissions
BEFORE DELETE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_permissions();

COMMIT;
