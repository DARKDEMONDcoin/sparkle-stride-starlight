CREATE TABLE public.brand_brain (
 workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
 website text NOT NULL DEFAULT '', sections jsonb NOT NULL DEFAULT '{}'::jsonb,
 revision integer NOT NULL DEFAULT 0, history jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brand_brain TO authenticated;
GRANT ALL ON public.brand_brain TO service_role;
ALTER TABLE public.brand_brain ENABLE ROW LEVEL SECURITY;
CREATE POLICY brand_brain_owner_read ON public.brand_brain FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id=workspace_id AND w.owner_id=auth.uid()));
CREATE TABLE public.brand_scan_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 website text NOT NULL, requested_section text CHECK(requested_section IN ('business','audience','voice','identity')),
 status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','completed','failed','paused','cancelled')),
 stage integer NOT NULL DEFAULT 0 CHECK(stage BETWEEN 0 AND 4), stages jsonb NOT NULL DEFAULT '[{"state":"waiting"},{"state":"waiting"},{"state":"waiting"},{"state":"waiting"}]'::jsonb,
 sources jsonb NOT NULL DEFAULT '[]'::jsonb, corpus jsonb NOT NULL DEFAULT '[]'::jsonb,
 error text, error_status integer, lease_token uuid, lease_until timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT(id,workspace_id,website,requested_section,status,stage,stages,sources,error,error_status,created_at,updated_at,lease_until) ON public.brand_scan_jobs TO authenticated;
GRANT ALL ON public.brand_scan_jobs TO service_role;
ALTER TABLE public.brand_scan_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY brand_scan_owner_read ON public.brand_scan_jobs FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.workspaces w WHERE w.id=workspace_id AND w.owner_id=auth.uid()));
CREATE UNIQUE INDEX brand_scan_single_active ON public.brand_scan_jobs(workspace_id) WHERE status IN ('queued','running');
CREATE FUNCTION private.brand_touch() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER brand_brain_updated BEFORE UPDATE ON public.brand_brain FOR EACH ROW EXECUTE FUNCTION private.brand_touch();
CREATE TRIGGER brand_job_updated BEFORE UPDATE ON public.brand_scan_jobs FOR EACH ROW EXECUTE FUNCTION private.brand_touch();
INSERT INTO public.brand_brain(workspace_id) SELECT id FROM public.workspaces ON CONFLICT DO NOTHING;
CREATE FUNCTION public.brand_enqueue(_workspace uuid,_website text,_section text DEFAULT NULL,_replace boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.brand_brain; j uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=_workspace AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Owner access required'; END IF;
 IF length(_website)>300 OR _website !~ '^https://[a-zA-Z0-9.-]+(/|$)' THEN RAISE EXCEPTION 'Invalid public website'; END IF;
 IF _section IS NOT NULL AND _section NOT IN ('business','audience','voice','identity') THEN RAISE EXCEPTION 'Invalid section'; END IF;
 INSERT INTO public.brand_brain(workspace_id) VALUES(_workspace) ON CONFLICT DO NOTHING;
 SELECT * INTO b FROM public.brand_brain WHERE workspace_id=_workspace FOR UPDATE;
 IF b.website<>'' AND b.website<>_website AND NOT _replace THEN RAISE EXCEPTION 'Confirm website replacement'; END IF;
 SELECT id INTO j FROM public.brand_scan_jobs WHERE workspace_id=_workspace AND status IN ('queued','running') LIMIT 1;
 IF j IS NOT NULL THEN RETURN j; END IF;
 UPDATE public.brand_brain SET website=_website WHERE workspace_id=_workspace;
 INSERT INTO public.brand_scan_jobs(workspace_id,website,requested_section) VALUES(_workspace,_website,_section) RETURNING id INTO j;
 RETURN j;
END $$;
REVOKE ALL ON FUNCTION public.brand_enqueue(uuid,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.brand_enqueue(uuid,text,text,boolean) TO authenticated;
CREATE FUNCTION public.brand_claim(_job uuid) RETURNS SETOF public.brand_scan_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN RETURN QUERY UPDATE public.brand_scan_jobs SET status='running',lease_token=gen_random_uuid(),lease_until=now()+interval '90 seconds' WHERE id=_job AND status IN ('queued','running') AND (lease_until IS NULL OR lease_until<now()) AND stage<4 RETURNING *; END $$;
REVOKE ALL ON FUNCTION public.brand_claim(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brand_claim(uuid) TO service_role;
CREATE FUNCTION public.brand_save_section(_workspace uuid,_section text,_data jsonb,_revision integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.brand_brain; s jsonb; r integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=_workspace AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Owner access required'; END IF;
 IF _section NOT IN ('business','audience','voice','identity') OR jsonb_typeof(_data)<>'object' OR octet_length(_data::text)>30000 THEN RAISE EXCEPTION 'Invalid section'; END IF;
 INSERT INTO public.brand_brain(workspace_id) VALUES(_workspace) ON CONFLICT DO NOTHING;
 SELECT * INTO b FROM public.brand_brain WHERE workspace_id=_workspace FOR UPDATE;
 IF b.revision<>_revision THEN RAISE EXCEPTION 'Brand changed; refresh before saving'; END IF;
 s=coalesce(b.sections->_section,'{}'::jsonb);
 s=s||jsonb_build_object('data',_data,'source','user','edited_at',now(),'edited_fields',coalesce(s->'edited_fields','[]'::jsonb));
 s=jsonb_set(s,'{edited_fields}',(SELECT coalesce(jsonb_agg(k),'[]'::jsonb) FROM (SELECT DISTINCT jsonb_object_keys(_data) k) q));
 UPDATE public.brand_brain SET sections=jsonb_set(sections,ARRAY[_section],s,true),revision=revision+1,history=(SELECT coalesce(jsonb_agg(v),'[]'::jsonb) FROM (SELECT value v FROM jsonb_array_elements(jsonb_build_array(b.sections)||b.history) WITH ORDINALITY e(value,n) WHERE n<=10) h) WHERE workspace_id=_workspace RETURNING revision INTO r;
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.brand_save_section(uuid,text,jsonb,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.brand_save_section(uuid,text,jsonb,integer) TO authenticated;
CREATE FUNCTION public.brand_undo(_workspace uuid,_revision integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.brand_brain; r integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=_workspace AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Owner access required'; END IF;
 SELECT * INTO b FROM public.brand_brain WHERE workspace_id=_workspace FOR UPDATE;
 IF b.revision<>_revision OR jsonb_array_length(b.history)=0 THEN RAISE EXCEPTION 'Nothing to undo or brand changed'; END IF;
 UPDATE public.brand_brain SET sections=history->0,history=history-0,revision=revision+1 WHERE workspace_id=_workspace RETURNING revision INTO r; RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.brand_undo(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.brand_undo(uuid,integer) TO authenticated;
CREATE FUNCTION public.brand_retry(_job uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.brand_scan_jobs;
BEGIN
 SELECT * INTO j FROM public.brand_scan_jobs WHERE id=_job FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=j.workspace_id AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Owner access required'; END IF;
 IF j.status NOT IN ('failed','paused','running') OR (j.status='running' AND j.lease_until>now()) THEN RAISE EXCEPTION 'Job cannot be retried'; END IF;
 IF j.error_status=403 THEN RAISE EXCEPTION 'Restore provider access before starting a new scan'; END IF;
 UPDATE public.brand_scan_jobs SET status='queued',error=NULL,error_status=NULL,lease_token=NULL,lease_until=NULL WHERE id=_job; RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.brand_retry(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.brand_retry(uuid) TO authenticated;
CREATE FUNCTION public.brand_checkpoint(_job uuid,_lease uuid,_data jsonb,_sources jsonb,_corpus jsonb DEFAULT NULL,_error text DEFAULT NULL,_status integer DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.brand_scan_jobs; b public.brand_brain; key text; s jsonb; d jsonb; suggestions jsonb; f text;
BEGIN
 SELECT * INTO j FROM public.brand_scan_jobs WHERE id=_job FOR UPDATE;
 IF j.status<>'running' OR j.lease_token IS DISTINCT FROM _lease OR j.lease_until<now() THEN RETURN false; END IF;
 key=(ARRAY['business','audience','voice','identity'])[j.stage+1];
 IF _error IS NOT NULL THEN
 UPDATE public.brand_scan_jobs SET status=CASE WHEN _status IN (402,403) THEN 'paused' ELSE 'failed' END,error=_error,error_status=_status,stages=jsonb_set(stages,ARRAY[j.stage::text],jsonb_build_object('state','failed','error',_error)),lease_token=NULL,lease_until=NULL WHERE id=_job; RETURN true;
 END IF;
 IF j.requested_section IS NULL OR j.requested_section=key THEN
 SELECT * INTO b FROM public.brand_brain WHERE workspace_id=j.workspace_id FOR UPDATE;
 s=coalesce(b.sections->key,'{}'::jsonb); d=coalesce(s->'data','{}'::jsonb); suggestions=coalesce(s->'suggestions','{}'::jsonb);
 FOR f IN SELECT jsonb_object_keys(_data) LOOP
 IF coalesce(s->'edited_fields','[]'::jsonb) ? f AND d->f IS DISTINCT FROM _data->f THEN suggestions=jsonb_set(suggestions,ARRAY[f],_data->f,true);
 ELSE d=jsonb_set(d,ARRAY[f],_data->f,true); END IF;
 END LOOP;
 s=s||jsonb_build_object('data',d,'detected',_data,'suggestions',suggestions,'source',CASE WHEN s->>'source'='user' THEN 'user' ELSE 'ai' END,'edited_at',now(),'sources',_sources);
 UPDATE public.brand_brain SET sections=jsonb_set(sections,ARRAY[key],s,true),revision=revision+1 WHERE workspace_id=j.workspace_id;
 END IF;
 UPDATE public.brand_scan_jobs SET stage=stage+1,status=CASE WHEN stage=3 THEN 'completed' ELSE 'queued' END,stages=jsonb_set(stages,ARRAY[j.stage::text],jsonb_build_object('state','done','summary',_data)),sources=_sources,corpus=coalesce(_corpus,corpus),lease_token=NULL,lease_until=NULL WHERE id=_job;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.brand_checkpoint(uuid,uuid,jsonb,jsonb,jsonb,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brand_checkpoint(uuid,uuid,jsonb,jsonb,jsonb,text,integer) TO service_role;
CREATE FUNCTION private.brand_sync_context() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.workspaces SET profile=coalesce(profile,'{}'::jsonb)||jsonb_build_object('brandBrain',NEW.sections),website=CASE WHEN NEW.sections ? 'business' THEN nullif(NEW.website,'') ELSE website END WHERE id=NEW.workspace_id;
 RETURN NEW;
END $$;
CREATE TRIGGER brand_context_sync AFTER INSERT OR UPDATE ON public.brand_brain FOR EACH ROW EXECUTE FUNCTION private.brand_sync_context();
INSERT INTO private.cron_tokens(name,token) VALUES('brand-scan',gen_random_uuid()::text) ON CONFLICT(name) DO NOTHING;
CREATE FUNCTION private.brand_wake() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE t text;
BEGIN
 IF NEW.status='queued' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
 SELECT token INTO t FROM private.cron_tokens WHERE name='brand-scan';
 PERFORM net.http_post(url:=private.app_base_url()||'/api/public/brand-scan',headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',t),body:=jsonb_build_object('jobId',NEW.id),timeout_milliseconds:=90000);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER brand_scan_wake AFTER INSERT OR UPDATE OF status ON public.brand_scan_jobs FOR EACH ROW EXECUTE FUNCTION private.brand_wake();