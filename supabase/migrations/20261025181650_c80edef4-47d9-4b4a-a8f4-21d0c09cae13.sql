ALTER TABLE public.tracking_audits ADD COLUMN coverage jsonb NOT NULL DEFAULT '{}', ADD COLUMN limitations jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.structure_audits ADD COLUMN coverage jsonb NOT NULL DEFAULT '{}', ADD COLUMN limitations jsonb NOT NULL DEFAULT '[]';
CREATE TABLE public.ads_recommendation_reviews(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL REFERENCES public.workspaces(id),ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id),recommendation_id uuid NOT NULL REFERENCES public.recommendations(id),decision text NOT NULL,decided_by uuid NOT NULL,proposal jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.ads_recommendation_reviews TO authenticated; GRANT ALL ON public.ads_recommendation_reviews TO service_role;
ALTER TABLE public.ads_recommendation_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads recommendation decisions" ON public.ads_recommendation_reviews FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));
CREATE TRIGGER ads_tenant_links BEFORE INSERT OR UPDATE ON public.ads_recommendation_reviews FOR EACH ROW EXECUTE FUNCTION public.ads_validate_tenant_links();
CREATE TRIGGER ads_touch_updated_at BEFORE UPDATE ON public.ads_recommendation_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE FUNCTION public.ads_employee_identity_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='UPDATE' AND OLD.employee_id='abdullah' AND NEW.employee_id IS DISTINCT FROM 'abdullah' THEN RAISE EXCEPTION 'Employee identity cannot change'; END IF;
 IF TG_OP='INSERT' AND NEW.employee_id IS NULL THEN NEW.employee_id:='abdullah'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER ads_00_employee_identity BEFORE INSERT OR UPDATE ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.ads_employee_identity_guard();
CREATE TRIGGER ads_00_employee_identity BEFORE INSERT OR UPDATE ON public.campaign_drafts FOR EACH ROW EXECUTE FUNCTION public.ads_employee_identity_guard();
CREATE FUNCTION public.ads_review_recommendation(p_id uuid,p_workspace_id uuid,p_owner_id uuid,p_decision text,p_expected_created_at timestamptz,p_new_change jsonb DEFAULT NULL,p_success_metric text DEFAULT NULL,p_review_at timestamptz DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.recommendations; b public.account_baselines;
BEGIN
 IF p_decision NOT IN('edit','approve','reject') OR p_decision IS NULL THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=p_workspace_id AND owner_id=p_owner_id) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 SELECT * INTO r FROM public.recommendations WHERE id=p_id AND workspace_id=p_workspace_id AND employee_id='abdullah' FOR UPDATE;
 IF r.id IS NULL OR r.status<>'pending' OR r.created_at IS DISTINCT FROM p_expected_created_at THEN RAISE EXCEPTION 'Proposal unavailable or already decided'; END IF;
 IF p_decision='reject' THEN
 UPDATE public.recommendations SET status='rejected',decided_by=p_owner_id,decided_at=now() WHERE id=r.id;
 ELSIF p_decision='edit' THEN
 IF p_new_change IS NULL OR jsonb_typeof(p_new_change) IS DISTINCT FROM 'object' OR p_success_metric IS NULL OR length(trim(p_success_metric))=0 OR p_review_at IS NULL OR p_review_at<=now() THEN RAISE EXCEPTION 'Complete edited proposal required'; END IF;
 UPDATE public.recommendations SET proposed_change=p_new_change,success_metric=p_success_metric,review_after_date=p_review_at,pre_change_snapshot=NULL,created_at=clock_timestamp() WHERE id=r.id;
 ELSE
 SELECT * INTO b FROM public.account_baselines WHERE id=r.baseline_id;
 IF r.pre_change_snapshot->>'serverCaptured' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Fresh pre-change capture required'; END IF;
 IF EXISTS(SELECT 1 FROM public.recommendations other WHERE other.workspace_id=r.workspace_id AND other.ad_account_id=r.ad_account_id AND other.employee_id='abdullah' AND other.id<>r.id AND other.status='approved' AND other.proposed_change->>'campaignId'=r.proposed_change->>'campaignId') THEN RAISE EXCEPTION 'Another major change awaits review on this campaign'; END IF;
 UPDATE public.recommendations SET status='approved',decided_by=p_owner_id,decided_at=now() WHERE id=r.id;
 END IF;
 INSERT INTO public.ads_recommendation_reviews(workspace_id,ad_account_id,recommendation_id,decision,decided_by,proposal) VALUES(r.workspace_id,r.ad_account_id,r.id,p_decision,p_owner_id,jsonb_build_object('before',r.proposed_change,'after',coalesce(p_new_change,r.proposed_change),'successMetric',coalesce(p_success_metric,r.success_metric),'reviewAt',coalesce(p_review_at,r.review_after_date)));
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.ads_review_recommendation(uuid,uuid,uuid,text,timestamptz,jsonb,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ads_review_recommendation(uuid,uuid,uuid,text,timestamptz,jsonb,text,timestamptz) TO service_role;