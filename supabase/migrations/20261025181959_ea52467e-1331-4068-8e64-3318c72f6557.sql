CREATE FUNCTION public.ads_held_execution_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.employee_id='abdullah' AND (NEW.status IN('approved','applied') OR NEW.implementation_status='implemented') THEN RAISE EXCEPTION 'Provider held: verified current-state capture and execution are unavailable'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER ads_held_execution BEFORE INSERT OR UPDATE ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.ads_held_execution_guard();
REVOKE ALL ON FUNCTION public.ads_held_execution_guard() FROM PUBLIC,anon,authenticated;