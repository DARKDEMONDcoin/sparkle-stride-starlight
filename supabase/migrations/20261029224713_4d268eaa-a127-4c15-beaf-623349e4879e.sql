CREATE TABLE public.backlink_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  directory_id text NOT NULL,
  status text NOT NULL DEFAULT 'todo',
  pack jsonb,
  listing_url text,
  live_checked_at timestamptz,
  live_ok boolean,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, directory_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backlink_submissions TO authenticated;
GRANT ALL ON public.backlink_submissions TO service_role;
ALTER TABLE public.backlink_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage backlink submissions" ON public.backlink_submissions
  FOR ALL TO authenticated USING (public.owns_workspace(workspace_id)) WITH CHECK (public.owns_workspace(workspace_id));
CREATE TRIGGER backlink_submissions_updated BEFORE UPDATE ON public.backlink_submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();