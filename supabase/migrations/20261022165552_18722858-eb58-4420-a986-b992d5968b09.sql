CREATE TABLE public.ad_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('google','meta','tiktok','linkedin')),
  method text NOT NULL DEFAULT 'oauth' CHECK (method IN ('oauth','connector')),
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','expired','error')),
  token_secret_id uuid,
  scopes text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.ad_connections TO authenticated;
GRANT ALL ON public.ad_connections TO service_role;
ALTER TABLE public.ad_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner views ad connections" ON public.ad_connections FOR SELECT TO authenticated USING (public.owns_workspace(workspace_id));
CREATE POLICY "owner removes ad connections" ON public.ad_connections FOR DELETE TO authenticated USING (public.owns_workspace(workspace_id));

CREATE TABLE public.ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.ad_connections(id) ON DELETE CASCADE,
  platform text NOT NULL,
  external_id text NOT NULL,
  name text,
  currency text,
  timezone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, external_id)
);
GRANT SELECT ON public.ad_accounts TO authenticated;
GRANT ALL ON public.ad_accounts TO service_role;
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner views ad accounts" ON public.ad_accounts FOR SELECT TO authenticated USING (public.owns_workspace(workspace_id));

CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  site_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_profiles TO authenticated;
GRANT ALL ON public.business_profiles TO service_role;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages business profiles" ON public.business_profiles FOR ALL TO authenticated USING (public.owns_workspace(workspace_id)) WITH CHECK (public.owns_workspace(workspace_id));

CREATE TABLE public.ad_guardrails (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  guidelines text NOT NULL DEFAULT '',
  daily_audit boolean NOT NULL DEFAULT false,
  max_budget_increase_pct numeric NOT NULL DEFAULT 20 CHECK (max_budget_increase_pct > 0 AND max_budget_increase_pct <= 100),
  monthly_cap numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ad_guardrails TO authenticated;
GRANT ALL ON public.ad_guardrails TO service_role;
ALTER TABLE public.ad_guardrails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages ad guardrails" ON public.ad_guardrails FOR ALL TO authenticated USING (public.owns_workspace(workspace_id)) WITH CHECK (public.owns_workspace(workspace_id));

CREATE TABLE public.campaign_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ad_account_id uuid NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('campaign','group','ad','keyword','search_term')),
  external_id text NOT NULL,
  parent_external_id text,
  name text,
  day date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ad_account_id, level, external_id, day)
);
GRANT SELECT ON public.campaign_snapshots TO authenticated;
GRANT ALL ON public.campaign_snapshots TO service_role;
ALTER TABLE public.campaign_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner views snapshots" ON public.campaign_snapshots FOR SELECT TO authenticated USING (public.owns_workspace(workspace_id));

CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  rationale text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}',
  proposed_change jsonb NOT NULL DEFAULT '{}',
  estimated_impact text,
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','applied','failed','expired')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid,
  decided_at timestamptz
);
GRANT SELECT ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner views recommendations" ON public.recommendations FOR SELECT TO authenticated USING (public.owns_workspace(workspace_id));

CREATE TABLE public.campaign_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  platform text NOT NULL,
  spec jsonb NOT NULL DEFAULT '{}',
  creatives jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','awaiting_approval','approved','launched','rejected')),
  external_campaign_id text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_drafts TO authenticated;
GRANT ALL ON public.campaign_drafts TO service_role;
ALTER TABLE public.campaign_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner views drafts" ON public.campaign_drafts FOR SELECT TO authenticated USING (public.owns_workspace(workspace_id));

CREATE TABLE public.change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES public.recommendations(id) ON DELETE SET NULL,
  draft_id uuid REFERENCES public.campaign_drafts(id) ON DELETE SET NULL,
  approved_by uuid NOT NULL,
  platform text NOT NULL,
  entity_id text NOT NULL,
  before_value jsonb,
  after_value jsonb,
  platform_response jsonb,
  ok boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.change_log TO authenticated;
GRANT SELECT, INSERT ON public.change_log TO service_role;
ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner views change log" ON public.change_log FOR SELECT TO authenticated USING (public.owns_workspace(workspace_id));

CREATE TABLE public.audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  trigger text NOT NULL CHECK (trigger IN ('manual','daily')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','done','failed')),
  summary text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT ON public.audit_runs TO authenticated;
GRANT ALL ON public.audit_runs TO service_role;
ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner views audit runs" ON public.audit_runs FOR SELECT TO authenticated USING (public.owns_workspace(workspace_id));