CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role text NOT NULL DEFAULT 'admin' CHECK(role='admin'), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own admin assignment" ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.ads_is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'); $$;
REVOKE ALL ON FUNCTION public.ads_is_admin() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.ads_is_admin() TO authenticated,service_role;

CREATE TABLE public.account_baselines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'building' CHECK(status IN('building','ready','stale')), mode text NOT NULL DEFAULT 'historical' CHECK(mode IN('historical','new_account')), covered_periods jsonb NOT NULL DEFAULT '[]', covered_entities jsonb NOT NULL DEFAULT '[]', immature_window jsonb NOT NULL DEFAULT '{}', data_quality jsonb NOT NULL DEFAULT '{}', benchmarks jsonb NOT NULL DEFAULT '{}', seasonality jsonb NOT NULL DEFAULT '{}', conversion_lag jsonb NOT NULL DEFAULT '{}', spend_concentration jsonb NOT NULL DEFAULT '{}', funnel jsonb NOT NULL DEFAULT '{}', change_overlay jsonb NOT NULL DEFAULT '[]', hypotheses jsonb NOT NULL DEFAULT '[]', limitations jsonb NOT NULL DEFAULT '[]', context_questions jsonb NOT NULL DEFAULT '[]', built_at timestamptz, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.account_baselines TO authenticated; GRANT ALL ON public.account_baselines TO service_role;
ALTER TABLE public.account_baselines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads baselines" ON public.account_baselines FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.change_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, provider_event_id text, entity_ref jsonb NOT NULL DEFAULT '{}', event_type text NOT NULL, before_value jsonb, after_value jsonb, actor_type text NOT NULL CHECK(actor_type IN('user','api','script','platform_automation','unknown')), occurred_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(ad_account_id,provider_event_id));
GRANT SELECT ON public.change_events TO authenticated; GRANT ALL ON public.change_events TO service_role;
ALTER TABLE public.change_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads change events" ON public.change_events FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.user_context_notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, note text NOT NULL, period_start date, period_end date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_context_notes TO authenticated; GRANT ALL ON public.user_context_notes TO service_role;
ALTER TABLE public.user_context_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages context notes" ON public.user_context_notes FOR ALL TO authenticated USING(public.owns_workspace(workspace_id)) WITH CHECK(public.owns_workspace(workspace_id));

CREATE TABLE public.account_learnings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, entity_ref jsonb NOT NULL DEFAULT '{}', learning text NOT NULL, evidence jsonb NOT NULL DEFAULT '{}', outcome text NOT NULL CHECK(outcome IN('worked','failed','inconclusive','confounded')), confidence text NOT NULL DEFAULT 'low' CHECK(confidence IN('high','medium','low')), source_change_id uuid REFERENCES public.change_log(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.account_learnings TO authenticated; GRANT ALL ON public.account_learnings TO service_role;
ALTER TABLE public.account_learnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads learnings" ON public.account_learnings FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.change_outcomes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, change_log_id uuid NOT NULL UNIQUE REFERENCES public.change_log(id), pre_snapshot jsonb NOT NULL, expected jsonb NOT NULL DEFAULT '{}', success_metric text NOT NULL, review_after timestamptz NOT NULL, evaluation jsonb, classification text CHECK(classification IN('worked','failed','inconclusive','confounded')), evaluated_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.change_outcomes TO authenticated; GRANT ALL ON public.change_outcomes TO service_role;
ALTER TABLE public.change_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads outcomes" ON public.change_outcomes FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.tracking_audits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, platform text NOT NULL CHECK(platform IN('google','meta')), findings jsonb NOT NULL DEFAULT '[]', score numeric, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.tracking_audits TO authenticated; GRANT ALL ON public.tracking_audits TO service_role;
ALTER TABLE public.tracking_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads tracking audits" ON public.tracking_audits FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.structure_audits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, platform text NOT NULL CHECK(platform IN('google','meta')), symptoms jsonb NOT NULL DEFAULT '[]', recommendations jsonb NOT NULL DEFAULT '[]', score numeric, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.structure_audits TO authenticated; GRANT ALL ON public.structure_audits TO service_role;
ALTER TABLE public.structure_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads structure audits" ON public.structure_audits FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.landing_pages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, url_normalized text NOT NULL, platforms text[] NOT NULL DEFAULT '{}', first_seen timestamptz NOT NULL DEFAULT now(), last_seen timestamptz NOT NULL DEFAULT now(), source text NOT NULL CHECK(source IN('ad_final_url','expanded_url','asset')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(ad_account_id,url_normalized));
GRANT SELECT ON public.landing_pages TO authenticated; GRANT ALL ON public.landing_pages TO service_role;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads landing pages" ON public.landing_pages FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.landing_page_metrics_daily (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE, platform text NOT NULL CHECK(platform IN('google','meta')), date date NOT NULL, device text NOT NULL DEFAULT 'all', spend numeric NOT NULL DEFAULT 0, clicks numeric NOT NULL DEFAULT 0, outbound_clicks numeric, landing_page_views numeric, conversions numeric NOT NULL DEFAULT 0, conversion_value numeric, speed_validity_metrics jsonb NOT NULL DEFAULT '{}', data_maturity text NOT NULL DEFAULT 'unknown' CHECK(data_maturity IN('mature','immature','unreliable','unknown')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(landing_page_id,platform,date,device));
GRANT SELECT ON public.landing_page_metrics_daily TO authenticated; GRANT ALL ON public.landing_page_metrics_daily TO service_role;
ALTER TABLE public.landing_page_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads page metrics" ON public.landing_page_metrics_daily FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.landing_page_audits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE, device text NOT NULL CHECK(device IN('mobile','desktop')), psi jsonb NOT NULL DEFAULT '{}', content_analysis jsonb NOT NULL DEFAULT '{}', tracking_findings jsonb NOT NULL DEFAULT '[]', scores jsonb NOT NULL DEFAULT '{}', confidence text NOT NULL DEFAULT 'low' CHECK(confidence IN('high','medium','low')), limitations jsonb NOT NULL DEFAULT '[]', fetched_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.landing_page_audits TO authenticated; GRANT ALL ON public.landing_page_audits TO service_role;
ALTER TABLE public.landing_page_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads page audits" ON public.landing_page_audits FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.experiments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, hypothesis text NOT NULL, variable_tested text NOT NULL, success_criteria jsonb NOT NULL DEFAULT '{}', planned_sample_or_duration jsonb NOT NULL DEFAULT '{}', start_date date, end_date date, status text NOT NULL DEFAULT 'planned' CHECK(status IN('planned','running','completed','cancelled')), result_summary jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.experiments TO authenticated; GRANT ALL ON public.experiments TO service_role;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages experiments" ON public.experiments FOR ALL TO authenticated USING(public.owns_workspace(workspace_id)) WITH CHECK(public.owns_workspace(workspace_id));

CREATE TABLE public.creative_concepts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE CASCADE, persona text NOT NULL, angle text NOT NULL, offer text NOT NULL, hook text, hypothesis text NOT NULL, formats text[] NOT NULL DEFAULT '{}', status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','approved','rejected','testing','completed')), results jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.creative_concepts TO authenticated; GRANT ALL ON public.creative_concepts TO service_role;
ALTER TABLE public.creative_concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages concepts" ON public.creative_concepts FOR ALL TO authenticated USING(public.owns_workspace(workspace_id)) WITH CHECK(public.owns_workspace(workspace_id));

CREATE TABLE public.api_usage (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, platform text NOT NULL CHECK(platform IN('google','meta')), date date NOT NULL, operations_count bigint NOT NULL DEFAULT 0 CHECK(operations_count>=0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id,platform,date));
GRANT SELECT ON public.api_usage TO authenticated; GRANT ALL ON public.api_usage TO service_role;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads api usage" ON public.api_usage FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.ad_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE, kind text NOT NULL CHECK(kind IN('history_sync','baseline','daily_audit','outcome_review','landing_page_audit')), dedupe_key text NOT NULL, status text NOT NULL DEFAULT 'queued' CHECK(status IN('queued','running','paused','completed','failed','cancelled')), cursor jsonb NOT NULL DEFAULT '{}', progress jsonb NOT NULL DEFAULT '{}', attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz, lease_token uuid, lease_expires_at timestamptz, pause_reason text, last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id,dedupe_key));
GRANT SELECT ON public.ad_jobs TO authenticated; GRANT ALL ON public.ad_jobs TO service_role;
ALTER TABLE public.ad_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads ads jobs" ON public.ad_jobs FOR SELECT TO authenticated USING(public.owns_workspace(workspace_id));

CREATE TABLE public.ad_provider_configs (workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE, platform text NOT NULL CHECK(platform IN('google','meta')), provider text NOT NULL CHECK(provider IN('direct','pipeboard','windsor')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(workspace_id,platform));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ad_provider_configs TO authenticated; GRANT ALL ON public.ad_provider_configs TO service_role;
ALTER TABLE public.ad_provider_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages provider choice" ON public.ad_provider_configs FOR ALL TO authenticated USING(public.owns_workspace(workspace_id)) WITH CHECK(public.owns_workspace(workspace_id));

CREATE TABLE public.ads_api_versions (platform text PRIMARY KEY CHECK(platform IN('google','meta')), version text NOT NULL, released_at date, sunset_at date, source_url text NOT NULL, verified_at timestamptz, notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ads_api_versions TO authenticated; GRANT ALL ON public.ads_api_versions TO service_role;
ALTER TABLE public.ads_api_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage api registry" ON public.ads_api_versions FOR ALL TO authenticated USING(public.ads_is_admin()) WITH CHECK(public.ads_is_admin());

ALTER TABLE public.ad_connections ADD COLUMN provider text CHECK(provider IN('direct','pipeboard','windsor')), ADD COLUMN provider_error_kind text;
ALTER TABLE public.campaign_snapshots ADD COLUMN data_maturity text NOT NULL DEFAULT 'unknown' CHECK(data_maturity IN('mature','immature','unreliable','unknown')), ADD COLUMN breakdowns jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.recommendations ADD COLUMN baseline_id uuid REFERENCES public.account_baselines(id), ADD COLUMN history_evidence jsonb, ADD COLUMN basis text CHECK(basis IN('official','practitioner','default')), ADD COLUMN confidence text CHECK(confidence IN('high','medium','low')), ADD COLUMN success_metric text, ADD COLUMN review_after_date timestamptz, ADD COLUMN pre_change_snapshot jsonb, ADD COLUMN implementation_status text CHECK(implementation_status IN('pending','implemented'));
ALTER TABLE public.campaign_drafts ADD COLUMN campaign_type text, ADD COLUMN baseline_id uuid REFERENCES public.account_baselines(id), ADD COLUMN lessons_from_history jsonb;
ALTER TABLE public.change_log ADD COLUMN ad_account_id uuid REFERENCES public.ad_accounts(id), ADD COLUMN created_object_ids jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.ad_guardrails ADD COLUMN baseline_freshness_days integer NOT NULL DEFAULT 7 CHECK(baseline_freshness_days BETWEEN 1 AND 30), ADD COLUMN new_account_min_days integer NOT NULL DEFAULT 30 CHECK(new_account_min_days>0), ADD COLUMN new_account_min_conversions integer NOT NULL DEFAULT 30 CHECK(new_account_min_conversions>0), ADD COLUMN forbid_stacked_major_changes boolean NOT NULL DEFAULT true;

CREATE FUNCTION public.ads_validate_tenant_links() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE row_data jsonb:=to_jsonb(NEW); pair text[]; target_id uuid; target_ws uuid; target_account uuid;
BEGIN
  IF TG_OP='UPDATE' AND row_data->>'workspace_id' IS DISTINCT FROM to_jsonb(OLD)->>'workspace_id' THEN RAISE EXCEPTION 'Advertising workspace identity cannot change'; END IF;
  FOREACH pair SLICE 1 IN ARRAY ARRAY[['ad_account_id','ad_accounts'],['connection_id','ad_connections'],['baseline_id','account_baselines'],['landing_page_id','landing_pages'],['business_profile_id','business_profiles'],['recommendation_id','recommendations'],['draft_id','campaign_drafts'],['change_log_id','change_log'],['source_change_id','change_log']] LOOP
    IF row_data->>pair[1] IS NOT NULL THEN
      target_id:=(row_data->>pair[1])::uuid;
      EXECUTE format('SELECT workspace_id FROM public.%I WHERE id=$1',pair[2]) INTO target_ws USING target_id;
      IF target_ws IS NULL OR target_ws IS DISTINCT FROM (row_data->>'workspace_id')::uuid THEN RAISE EXCEPTION 'Advertising reference belongs to a different workspace'; END IF;
      IF pair[2] IN('account_baselines','landing_pages','recommendations','campaign_drafts','business_profiles','change_log') AND row_data->>'ad_account_id' IS NOT NULL THEN
        EXECUTE format('SELECT ad_account_id FROM public.%I WHERE id=$1',pair[2]) INTO target_account USING target_id;
        IF target_account IS NOT NULL AND target_account IS DISTINCT FROM (row_data->>'ad_account_id')::uuid THEN RAISE EXCEPTION 'Advertising reference belongs to a different account'; END IF;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END; $$;
CREATE FUNCTION public.ads_immutable_change_log() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'Advertising change log is immutable'; END; $$;
CREATE TRIGGER ads_change_log_immutable BEFORE UPDATE OR DELETE ON public.change_log FOR EACH ROW EXECUTE FUNCTION public.ads_immutable_change_log();
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['account_baselines','change_events','user_context_notes','account_learnings','change_outcomes','tracking_audits','structure_audits','landing_pages','landing_page_metrics_daily','landing_page_audits','experiments','creative_concepts','api_usage','ad_jobs','ad_provider_configs','ads_api_versions'] LOOP
  EXECUTE format('CREATE TRIGGER ads_touch_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['account_baselines','change_events','user_context_notes','account_learnings','change_outcomes','tracking_audits','structure_audits','landing_pages','landing_page_metrics_daily','landing_page_audits','experiments','creative_concepts','ad_jobs','ad_accounts','business_profiles','campaign_snapshots','recommendations','campaign_drafts','change_log','audit_runs'] LOOP
  EXECUTE format('CREATE TRIGGER ads_tenant_links BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.ads_validate_tenant_links()',t);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(workspace_id)',t||'_workspace_lookup',t);
 END LOOP;
END; $$;
CREATE INDEX ad_jobs_pending ON public.ad_jobs(status,next_attempt_at) WHERE status IN('queued','running');
CREATE INDEX outcomes_due ON public.change_outcomes(review_after) WHERE evaluated_at IS NULL;
CREATE INDEX baselines_account_built ON public.account_baselines(ad_account_id,built_at DESC);
CREATE INDEX change_events_account_time ON public.change_events(ad_account_id,occurred_at DESC);