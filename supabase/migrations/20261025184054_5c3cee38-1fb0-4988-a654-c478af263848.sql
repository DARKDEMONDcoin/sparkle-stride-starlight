CREATE TABLE public.ads_page_fix_tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id), ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id), landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id), audit_id uuid NOT NULL REFERENCES public.landing_page_audits(id), baseline_id uuid NOT NULL REFERENCES public.account_baselines(id), category text NOT NULL, steps jsonb NOT NULL CHECK(jsonb_typeof(steps)='array'), success_metric text NOT NULL, review_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','implemented')), implemented_at timestamptz, implemented_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ads_page_fix_tickets TO authenticated;
GRANT ALL ON public.ads_page_fix_tickets TO service_role;
ALTER TABLE public.ads_page_fix_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners read page fix tickets" ON public.ads_page_fix_tickets FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));
CREATE TRIGGER ads_tenant_links BEFORE INSERT OR UPDATE ON public.ads_page_fix_tickets FOR EACH ROW EXECUTE FUNCTION public.ads_validate_tenant_links();
CREATE TRIGGER ads_touch_updated_at BEFORE UPDATE ON public.ads_page_fix_tickets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE FUNCTION public.ads_page_ticket_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE b public.account_baselines; freshness integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.landing_page_audits a WHERE a.id=NEW.audit_id AND a.landing_page_id=NEW.landing_page_id AND a.ad_account_id=NEW.ad_account_id AND a.workspace_id=NEW.workspace_id) THEN RAISE EXCEPTION 'Audit does not belong to this page'; END IF;
 IF TG_OP='INSERT' THEN
 SELECT * INTO b FROM public.account_baselines WHERE id=NEW.baseline_id AND workspace_id=NEW.workspace_id AND ad_account_id=NEW.ad_account_id;
 SELECT baseline_freshness_days INTO freshness FROM public.ad_guardrails WHERE workspace_id=NEW.workspace_id;
 IF b.id IS NULL OR b.status<>'ready' OR b.mode<>'historical' OR b.built_at IS NULL OR b.built_at>now() OR b.expires_at IS NULL OR b.expires_at<=now() OR b.built_at<now()-make_interval(days=>coalesce(freshness,7)) OR b.data_quality->>'verified_source' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Fresh verified historical baseline required'; END IF;
 IF EXISTS(SELECT 1 FROM public.change_events WHERE workspace_id=NEW.workspace_id AND ad_account_id=NEW.ad_account_id AND occurred_at>b.built_at AND event_type IN('budget','bid_strategy','targeting','structure','creative_launch','tracking','major_change')) THEN RAISE EXCEPTION 'Baseline predates major change'; END IF;
 IF NEW.review_at<=now() OR length(trim(NEW.success_metric))=0 OR jsonb_array_length(NEW.steps)=0 THEN RAISE EXCEPTION 'Success metric, steps and future review date required'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER ads_page_ticket_evidence BEFORE INSERT OR UPDATE ON public.ads_page_fix_tickets FOR EACH ROW EXECUTE FUNCTION public.ads_page_ticket_guard();
ALTER TABLE public.landing_pages ADD COLUMN audit_not_before timestamptz;
CREATE FUNCTION public.ads_claim_page_audit(p_page_id uuid,p_workspace_id uuid,p_account_id uuid) RETURNS boolean LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 UPDATE public.landing_pages SET audit_not_before=now()+interval '5 minutes' WHERE id=p_page_id AND workspace_id=p_workspace_id AND ad_account_id=p_account_id AND (audit_not_before IS NULL OR audit_not_before<=now());
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.ads_claim_page_audit(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ads_claim_page_audit(uuid,uuid,uuid) TO service_role;
CREATE FUNCTION public.ads_mark_page_fix(p_ticket_id uuid,p_workspace_id uuid,p_owner_id uuid) RETURNS boolean LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=p_workspace_id AND owner_id=p_owner_id) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 UPDATE public.ads_page_fix_tickets SET status='implemented',implemented_at=now(),implemented_by=p_owner_id WHERE id=p_ticket_id AND workspace_id=p_workspace_id AND status='pending';
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.ads_mark_page_fix(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ads_mark_page_fix(uuid,uuid,uuid) TO service_role;