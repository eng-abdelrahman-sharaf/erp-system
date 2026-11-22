SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.protect_admin_role()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$BEGIN
    IF OLD.name = 'Admin' THEN
        RAISE EXCEPTION 'The Admin role cannot be deleted or renamed';
    END IF;

    RETURN NEW;
END;$function$;

