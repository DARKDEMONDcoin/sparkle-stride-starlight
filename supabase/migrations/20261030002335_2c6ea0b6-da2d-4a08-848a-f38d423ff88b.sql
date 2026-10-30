REVOKE ALL ON public.n8n FROM anon, authenticated;
GRANT ALL ON public.n8n TO service_role;
CREATE POLICY "Service role only" ON public.n8n FOR ALL TO service_role USING (true) WITH CHECK (true);