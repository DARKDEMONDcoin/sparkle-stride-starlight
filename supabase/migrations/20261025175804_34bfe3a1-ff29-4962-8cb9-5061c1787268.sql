ALTER TABLE public.recommendations ADD COLUMN employee_id text;
ALTER TABLE public.recommendations ALTER COLUMN employee_id SET DEFAULT 'abdullah';
ALTER TABLE public.campaign_drafts ADD COLUMN employee_id text;
ALTER TABLE public.campaign_drafts ALTER COLUMN employee_id SET DEFAULT 'abdullah';
CREATE TABLE public.ads_baseline_sources(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id), ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id), baseline_id uuid NOT NULL REFERENCES public.account_baselines(id), snapshot_id uuid NOT NULL REFERENCES public.campaign_snapshots(id), payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(baseline_id,snapshot_id));
GRANT SELECT ON public.ads_baseline_sources TO authenticated; GRANT ALL ON public.ads_baseline_sources TO service_role;
ALTER TABLE public.ads_baseline_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads baseline sources" ON public.ads_baseline_sources FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));
CREATE TRIGGER ads_tenant_links BEFORE INSERT OR UPDATE ON public.ads_baseline_sources FOR EACH ROW EXECUTE FUNCTION public.ads_validate_tenant_links();
CREATE TRIGGER ads_touch_updated_at BEFORE UPDATE ON public.ads_baseline_sources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE FUNCTION public.ads_evidence_gate() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE b public.account_baselines; freshness integer; ref jsonb; n jsonb:=to_jsonb(NEW);
BEGIN
 IF n->>'employee_id' IS DISTINCT FROM 'abdullah' THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='recommendations' AND NEW.status IN('rejected','failed','expired') THEN RETURN NEW; END IF;
 SELECT coalesce(g.baseline_freshness_days,7) INTO freshness FROM public.ad_guardrails g WHERE g.workspace_id=NEW.workspace_id;
 freshness:=coalesce(freshness,7);
 SELECT * INTO b FROM public.account_baselines WHERE id=NEW.baseline_id AND workspace_id=NEW.workspace_id AND ad_account_id=NEW.ad_account_id;
 IF b.id IS NULL OR b.status<>'ready' OR b.built_at IS NULL OR b.built_at>now() OR b.built_at<now()-make_interval(days=>freshness) OR b.expires_at IS NULL OR b.expires_at<=now() OR b.data_quality->>'verified_source' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Ready fresh verified account baseline required'; END IF;
 IF EXISTS(SELECT 1 FROM public.change_events WHERE ad_account_id=NEW.ad_account_id AND workspace_id=NEW.workspace_id AND occurred_at>b.built_at AND event_type IN('budget','bid_strategy','targeting','structure','creative_launch','tracking','major_change')) THEN RAISE EXCEPTION 'Baseline requires rebuild after major change'; END IF;
 IF TG_TABLE_NAME='campaign_drafts' THEN
   IF jsonb_typeof(NEW.lessons_from_history) IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.lessons_from_history)=0 THEN RAISE EXCEPTION 'Lessons from history required'; END IF;
   IF b.mode='new_account' AND NEW.spec->>'mode' IS DISTINCT FROM 'new_account' THEN RAISE EXCEPTION 'New account setup and test mode required'; END IF;
 ELSE
   ref:=NEW.proposed_change->'entity';
   IF ref IS NULL OR NOT b.covered_entities @> jsonb_build_array(ref) THEN RAISE EXCEPTION 'Baseline does not cover entity'; END IF;
   IF jsonb_typeof(NEW.history_evidence->'periods') IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.history_evidence->'periods')<2 OR jsonb_typeof(NEW.history_evidence->'numbers') IS DISTINCT FROM 'object' OR NEW.history_evidence->'numbers'='{}'::jsonb OR jsonb_typeof(NEW.history_evidence->'changeEvents') IS DISTINCT FROM 'array' OR NEW.history_evidence->>'maturity' IS DISTINCT FROM 'mature' THEN RAISE EXCEPTION 'Compared historical evidence and maturity required'; END IF;
   IF b.mode='new_account' AND (NEW.type NOT IN('setup','tracking','structure','small_test') OR NEW.confidence IS DISTINCT FROM 'low' OR NEW.estimated_impact IS NOT NULL) THEN RAISE EXCEPTION 'New account recommendations restricted'; END IF;
   IF NEW.status IN('approved','applied') THEN
     IF NEW.success_metric IS NULL OR length(trim(NEW.success_metric))=0 OR NEW.review_after_date IS NULL OR NEW.review_after_date<=now() OR jsonb_typeof(NEW.pre_change_snapshot) IS DISTINCT FROM 'object' OR NEW.pre_change_snapshot->>'serverCaptured' IS DISTINCT FROM 'true' OR NEW.pre_change_snapshot->'entity' IS NULL OR NEW.pre_change_snapshot->'parent' IS NULL OR NEW.decided_by IS NULL THEN RAISE EXCEPTION 'Approval requires captured entity and parent evidence, decision, success metric and future review date'; END IF;
     IF (NEW.pre_change_snapshot->>'capturedAt')::timestamptz<now()-interval '15 minutes' THEN RAISE EXCEPTION 'Pre-change snapshot expired'; END IF;
     IF NEW.review_after_date < (NEW.pre_change_snapshot->>'earliestReviewAt')::timestamptz OR NEW.pre_change_snapshot->>'earliestReviewAt' IS NULL THEN RAISE EXCEPTION 'Review must follow learning and conversion lag'; END IF;
   END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.ads_evidence_gate() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER ads_required_evidence BEFORE INSERT OR UPDATE ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.ads_evidence_gate();
CREATE TRIGGER ads_required_evidence BEFORE INSERT OR UPDATE ON public.campaign_drafts FOR EACH ROW EXECUTE FUNCTION public.ads_evidence_gate();
CREATE FUNCTION public.ads_baseline_page(p_job_id uuid,p_token uuid,p_baseline_id uuid,p_today date,p_since date) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.ad_jobs; last_id uuid; batch_count integer; total_count integer;
BEGIN
 SELECT * INTO j FROM public.ad_jobs WHERE id=p_job_id AND lease_token=p_token AND status='running' AND lease_expires_at>clock_timestamp() FOR UPDATE;
 IF j.id IS NULL THEN RETURN false; END IF;
 IF j.kind<>'baseline' OR NOT EXISTS(SELECT 1 FROM public.account_baselines WHERE id=p_baseline_id AND workspace_id=j.workspace_id AND ad_account_id=j.ad_account_id AND status='building') OR j.cursor->>'baselineId' IS DISTINCT FROM p_baseline_id::text OR j.cursor->>'today' IS DISTINCT FROM p_today::text OR j.cursor->>'since' IS DISTINCT FROM p_since::text THEN RAISE EXCEPTION 'Invalid baseline job scope'; END IF;
 SELECT count(*) INTO total_count FROM public.ads_baseline_sources WHERE baseline_id=p_baseline_id;
 IF total_count>=3000 THEN
 UPDATE public.ad_jobs SET status='paused',pause_reason='saved_review_limit',lease_token=NULL,lease_expires_at=NULL WHERE id=j.id; RETURN true;
 END IF;
 WITH batch AS(SELECT s.* FROM public.campaign_snapshots s WHERE s.workspace_id=j.workspace_id AND s.ad_account_id=j.ad_account_id AND s.day>=p_since AND s.day<p_today AND s.fetched_at<=j.created_at AND (j.cursor->>'lastId' IS NULL OR s.id>(j.cursor->>'lastId')::uuid) ORDER BY s.id LIMIT 500), copied AS(INSERT INTO public.ads_baseline_sources(workspace_id,ad_account_id,baseline_id,snapshot_id,payload) SELECT j.workspace_id,j.ad_account_id,p_baseline_id,id,to_jsonb(batch) FROM batch ON CONFLICT DO NOTHING RETURNING snapshot_id)
 SELECT count(*),max(snapshot_id::text)::uuid INTO batch_count,last_id FROM copied;
 UPDATE public.ad_jobs SET cursor=j.cursor||jsonb_build_object('lastId',coalesce(last_id::text,j.cursor->>'lastId'),'scanComplete',batch_count<500), progress=jsonb_build_object('completed',total_count+batch_count,'total',3000),status='queued',attempts=0,next_attempt_at=now()+interval '1 second',lease_token=NULL,lease_expires_at=NULL WHERE id=j.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.ads_baseline_page(uuid,uuid,uuid,date,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ads_baseline_page(uuid,uuid,uuid,date,date) TO service_role;