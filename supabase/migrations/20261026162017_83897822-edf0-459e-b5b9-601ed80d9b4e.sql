ALTER TABLE public.campaign_drafts DROP CONSTRAINT IF EXISTS campaign_drafts_status_check;
ALTER TABLE public.campaign_drafts ADD CONSTRAINT campaign_drafts_status_check CHECK (status IN ('draft','awaiting_approval','approved','paused_created','launched','rejected'));
CREATE OR REPLACE FUNCTION public.ads_draft_transition_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.status='approved' AND (TG_OP='INSERT' OR OLD.status<>'awaiting_approval' OR NEW.decided_by IS NULL) THEN RAISE EXCEPTION 'Plan approval requires an owner decision on an awaiting plan'; END IF;
 IF NEW.status='paused_created' AND (TG_OP='INSERT' OR OLD.status<>'approved' OR coalesce(NEW.external_campaign_id,'')='') THEN RAISE EXCEPTION 'Paused creation requires an approved plan and a provider campaign id'; END IF;
 IF NEW.status='launched' AND (TG_OP='INSERT' OR OLD.status<>'paused_created' OR coalesce(NEW.external_campaign_id,'')='' OR NEW.spec->'launch'->>'confirmedBy' IS NULL) THEN RAISE EXCEPTION 'Launch requires a paused campaign and a separate final confirmation'; END IF;
 IF TG_OP='UPDATE' AND OLD.status IN('launched','rejected') AND NEW.status IS DISTINCT FROM OLD.status THEN RAISE EXCEPTION 'Final draft state cannot change'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.ads_draft_transition_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER ads_draft_transitions BEFORE INSERT OR UPDATE ON public.campaign_drafts FOR EACH ROW EXECUTE FUNCTION public.ads_draft_transition_guard();