CREATE OR REPLACE FUNCTION public.ads_evidence_gate() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE b public.account_baselines; freshness integer; ref jsonb; n jsonb:=to_jsonb(NEW);
BEGIN
 IF n->>'employee_id' IS DISTINCT FROM 'abdullah' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND to_jsonb(OLD)->>'employee_id'='abdullah' AND n->>'employee_id' IS DISTINCT FROM 'abdullah' THEN RAISE EXCEPTION 'Employee identity cannot change'; END IF;
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
   IF jsonb_typeof(ref) IS DISTINCT FROM 'object' OR coalesce(length(ref->>'level'),0)=0 OR coalesce(length(ref->>'externalId'),0)=0 OR NOT b.covered_entities @> jsonb_build_array(ref) THEN RAISE EXCEPTION 'Baseline does not cover entity'; END IF;
   IF jsonb_typeof(NEW.history_evidence->'periods') IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.history_evidence->'periods')<2 OR jsonb_typeof(NEW.history_evidence->'numbers') IS DISTINCT FROM 'object' OR NEW.history_evidence->'numbers'='{}'::jsonb OR jsonb_typeof(NEW.history_evidence->'changeEvents') IS DISTINCT FROM 'array' OR NEW.history_evidence->>'maturity' IS DISTINCT FROM 'mature' OR NEW.history_evidence->>'baselineId' IS DISTINCT FROM b.id::text THEN RAISE EXCEPTION 'Compared historical evidence and maturity required'; END IF;
   IF b.mode='new_account' AND (NEW.type NOT IN('setup','tracking','structure','small_test') OR NEW.confidence IS DISTINCT FROM 'low' OR NEW.estimated_impact IS NOT NULL) THEN RAISE EXCEPTION 'New account recommendations restricted'; END IF;
   IF NEW.status IN('approved','applied') THEN
     IF NEW.success_metric IS NULL OR length(trim(NEW.success_metric))=0 OR NEW.review_after_date IS NULL OR NEW.review_after_date<=now() OR jsonb_typeof(NEW.pre_change_snapshot) IS DISTINCT FROM 'object' OR NEW.pre_change_snapshot->>'serverCaptured' IS DISTINCT FROM 'true' OR NEW.pre_change_snapshot->'entity' IS NULL OR NEW.pre_change_snapshot->'parent' IS NULL OR NEW.decided_by IS NULL THEN RAISE EXCEPTION 'Approval requires captured entity and parent evidence, decision, success metric and future review date'; END IF;
     IF NEW.pre_change_snapshot->>'capturedAt' IS NULL OR (NEW.pre_change_snapshot->>'capturedAt')::timestamptz<now()-interval '15 minutes' OR (NEW.pre_change_snapshot->>'capturedAt')::timestamptz>now() THEN RAISE EXCEPTION 'Pre-change snapshot expired'; END IF;
     IF NEW.pre_change_snapshot->>'earliestReviewAt' IS NULL OR NEW.review_after_date < (NEW.pre_change_snapshot->>'earliestReviewAt')::timestamptz THEN RAISE EXCEPTION 'Review must follow learning and conversion lag'; END IF;
   END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION public.ads_record_outcome(p_outcome_id uuid,p_workspace_id uuid,p_account_id uuid,p_evaluation jsonb,p_classification text,p_learning text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_change uuid;
BEGIN
 IF p_classification NOT IN('worked','failed','inconclusive','confounded') OR jsonb_typeof(p_evaluation) IS DISTINCT FROM 'object' OR pg_column_size(p_evaluation)>65536 OR coalesce(length(trim(p_learning)),0)=0 THEN RAISE EXCEPTION 'Invalid outcome'; END IF;
 UPDATE public.change_outcomes SET evaluation=p_evaluation,classification=p_classification,evaluated_at=now() WHERE id=p_outcome_id AND workspace_id=p_workspace_id AND ad_account_id=p_account_id AND evaluated_at IS NULL AND review_after<=now() RETURNING change_log_id INTO v_change;
 IF v_change IS NULL THEN RETURN false; END IF;
 INSERT INTO public.account_learnings(workspace_id,ad_account_id,source_change_id,learning,evidence,outcome,confidence) VALUES(p_workspace_id,p_account_id,v_change,p_learning,p_evaluation,p_classification,'low');
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.ads_record_outcome(uuid,uuid,uuid,jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ads_record_outcome(uuid,uuid,uuid,jsonb,text,text) TO service_role;