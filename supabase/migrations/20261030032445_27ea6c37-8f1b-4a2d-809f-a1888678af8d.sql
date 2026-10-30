CREATE OR REPLACE FUNCTION public.brand_save_section(_workspace uuid,_section text,_data jsonb,_revision integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.brand_brain; s jsonb; r integer; edited jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=_workspace AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Owner access required'; END IF;
 IF _section NOT IN ('business','audience','voice','identity') OR jsonb_typeof(_data)<>'object' OR octet_length(_data::text)>30000 THEN RAISE EXCEPTION 'Invalid section'; END IF;
 INSERT INTO public.brand_brain(workspace_id) VALUES(_workspace) ON CONFLICT DO NOTHING;
 SELECT * INTO b FROM public.brand_brain WHERE workspace_id=_workspace FOR UPDATE;
 IF b.revision<>_revision THEN RAISE EXCEPTION 'Brand changed; refresh before saving'; END IF;
 s=coalesce(b.sections->_section,'{}'::jsonb);
 SELECT coalesce(jsonb_agg(DISTINCT field),'[]'::jsonb) INTO edited FROM (SELECT jsonb_array_elements_text(coalesce(s->'edited_fields','[]'::jsonb)) field UNION SELECT key FROM jsonb_each(_data) WHERE value IS DISTINCT FROM s->'data'->key) q;
 s=s||jsonb_build_object('data',_data,'source','user','edited_at',now(),'edited_fields',edited);
 UPDATE public.brand_brain SET sections=jsonb_set(sections,ARRAY[_section],s,true),revision=revision+1,history=(SELECT coalesce(jsonb_agg(v),'[]'::jsonb) FROM (SELECT value v FROM jsonb_array_elements(jsonb_build_array(b.sections)||b.history) WITH ORDINALITY e(value,n) WHERE n<=10) h) WHERE workspace_id=_workspace RETURNING revision INTO r;
 RETURN r;
END $$;
CREATE FUNCTION public.brand_review_field(_owner uuid,_workspace uuid,_section text,_field text,_accept boolean,_revision integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.brand_brain; s jsonb; r integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=_workspace AND owner_id=_owner) THEN RAISE EXCEPTION 'Owner access required'; END IF;
 SELECT * INTO b FROM public.brand_brain WHERE workspace_id=_workspace FOR UPDATE;
 IF b.revision<>_revision THEN RAISE EXCEPTION 'Brand changed; refresh before review'; END IF;
 s=b.sections->_section;
 IF NOT coalesce(s->'suggestions','{}'::jsonb) ? _field THEN RAISE EXCEPTION 'Suggestion not found'; END IF;
 IF _accept THEN s=jsonb_set(s,ARRAY['data',_field],s->'suggestions'->_field,true)||jsonb_build_object('source','user','edited_at',now()); END IF;
 s=jsonb_set(s,'{suggestions}',(s->'suggestions')-_field);
 UPDATE public.brand_brain SET sections=jsonb_set(sections,ARRAY[_section],s),revision=revision+1,history=(SELECT coalesce(jsonb_agg(v),'[]'::jsonb) FROM (SELECT value v FROM jsonb_array_elements(jsonb_build_array(b.sections)||b.history) WITH ORDINALITY e(value,n) WHERE n<=10) h) WHERE workspace_id=_workspace RETURNING revision INTO r; RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.brand_review_field(uuid,uuid,text,text,boolean,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brand_review_field(uuid,uuid,text,text,boolean,integer) TO service_role;
CREATE OR REPLACE FUNCTION private.brand_wake() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE t text;
BEGIN
 IF NEW.status='queued' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
 SELECT token INTO t FROM private.cron_tokens WHERE name='brand-scan';
 PERFORM net.http_post(url:=private.app_base_url()||'/api/public/brand-scan',headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',t),body:=jsonb_build_object('jobId',NEW.id),timeout_milliseconds:=70000);
 END IF; RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.brand_claim(_job uuid) RETURNS SETOF public.brand_scan_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN RETURN QUERY UPDATE public.brand_scan_jobs SET status='running',lease_token=gen_random_uuid(),lease_until=now()+interval '60 seconds' WHERE id=_job AND status='queued' AND (lease_until IS NULL OR lease_until<now()) AND stage<4 RETURNING *; END $$;
REVOKE ALL ON FUNCTION private.brand_wake(),private.brand_sync_context(),private.brand_touch() FROM PUBLIC,anon,authenticated;