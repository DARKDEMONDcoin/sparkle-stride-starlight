CREATE OR REPLACE FUNCTION public.brand_claim(_job uuid) RETURNS SETOF public.brand_scan_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN RETURN QUERY UPDATE public.brand_scan_jobs SET status='running',lease_token=gen_random_uuid(),lease_until=now()+interval '150 seconds' WHERE id=_job AND status='queued' AND (lease_until IS NULL OR lease_until<now()) AND stage<4 RETURNING *; END $$;
CREATE OR REPLACE FUNCTION public.brand_retry(_job uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.brand_scan_jobs;
BEGIN
 SELECT * INTO j FROM public.brand_scan_jobs WHERE id=_job FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=j.workspace_id AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Owner access required'; END IF;
 IF j.status NOT IN ('failed','paused','running','queued') OR (j.status='running' AND j.lease_until>now()) OR (j.status='queued' AND j.updated_at>now()-interval '2 minutes') THEN RAISE EXCEPTION 'Job cannot be retried'; END IF;
 IF j.error_status IN (402,403) THEN RAISE EXCEPTION 'Restore provider access before starting a new scan'; END IF;
 UPDATE public.brand_scan_jobs SET status='failed' WHERE id=_job;
 UPDATE public.brand_scan_jobs SET status='queued',error=NULL,error_status=NULL,lease_token=NULL,lease_until=NULL WHERE id=_job; RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.brand_review_field(_owner uuid,_workspace uuid,_section text,_field text,_accept boolean,_revision integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.brand_brain; s jsonb; r integer; edited jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=_workspace AND owner_id=_owner) THEN RAISE EXCEPTION 'Owner access required'; END IF;
 SELECT * INTO b FROM public.brand_brain WHERE workspace_id=_workspace FOR UPDATE;
 IF b.revision<>_revision THEN RAISE EXCEPTION 'Brand changed; refresh before review'; END IF;
 s=b.sections->_section;
 IF NOT coalesce(s->'suggestions','{}'::jsonb) ? _field THEN RAISE EXCEPTION 'Suggestion not found'; END IF;
 IF _accept THEN
 SELECT coalesce(jsonb_agg(DISTINCT field),'[]'::jsonb) INTO edited FROM (SELECT jsonb_array_elements_text(coalesce(s->'edited_fields','[]'::jsonb)) field UNION SELECT _field) q;
 s=jsonb_set(s,ARRAY['data',_field],s->'suggestions'->_field,true)||jsonb_build_object('source','user','edited_at',now(),'edited_fields',edited);
 ELSE s=jsonb_set(s,'{ignored}',coalesce(s->'ignored','{}'::jsonb)||jsonb_build_object(_field,s->'suggestions'->_field),true);
 END IF;
 s=jsonb_set(s,'{suggestions}',(s->'suggestions')-_field);
 UPDATE public.brand_brain SET sections=jsonb_set(sections,ARRAY[_section],s),revision=revision+1,history=(SELECT coalesce(jsonb_agg(v),'[]'::jsonb) FROM (SELECT value v FROM jsonb_array_elements(jsonb_build_array(b.sections)||b.history) WITH ORDINALITY e(value,n) WHERE n<=10) h) WHERE workspace_id=_workspace RETURNING revision INTO r; RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.brand_checkpoint(_job uuid,_lease uuid,_data jsonb,_sources jsonb,_corpus jsonb DEFAULT NULL,_error text DEFAULT NULL,_status integer DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.brand_scan_jobs; b public.brand_brain; key text; s jsonb; d jsonb; suggestions jsonb; f text;
BEGIN
 SELECT * INTO j FROM public.brand_scan_jobs WHERE id=_job FOR UPDATE;
 IF j.status<>'running' OR j.lease_token IS DISTINCT FROM _lease OR j.lease_until<now() THEN RETURN false; END IF;
 key=(ARRAY['business','audience','voice','identity'])[j.stage+1];
 IF _error IS NOT NULL THEN
 UPDATE public.brand_scan_jobs SET status=CASE WHEN _status IN (402,403) THEN 'paused' ELSE 'failed' END,error=_error,error_status=_status,stages=jsonb_set(stages,ARRAY[j.stage::text],jsonb_build_object('state','failed','error',_error,'summary',coalesce(stages->j.stage->'summary','{}'::jsonb))),lease_token=NULL,lease_until=NULL WHERE id=_job; RETURN true;
 END IF;
 IF j.requested_section IS NULL OR j.requested_section=key THEN
 SELECT * INTO b FROM public.brand_brain WHERE workspace_id=j.workspace_id FOR UPDATE;
 s=coalesce(b.sections->key,'{}'::jsonb); d=coalesce(s->'data','{}'::jsonb); suggestions=coalesce(s->'suggestions','{}'::jsonb);
 FOR f IN SELECT jsonb_object_keys(_data) LOOP
 IF coalesce(s->'edited_fields','[]'::jsonb) ? f AND d->f IS DISTINCT FROM _data->f THEN
 IF s->'ignored'->f IS DISTINCT FROM _data->f THEN suggestions=jsonb_set(suggestions,ARRAY[f],_data->f,true); ELSE suggestions=suggestions-f; END IF;
 ELSE d=jsonb_set(d,ARRAY[f],_data->f,true); suggestions=suggestions-f; END IF;
 END LOOP;
 s=s||jsonb_build_object('data',d,'detected',_data,'suggestions',suggestions,'source',CASE WHEN s->>'source'='user' THEN 'user' ELSE 'ai' END,'edited_at',now(),'sources',_sources);
 UPDATE public.brand_brain SET sections=jsonb_set(sections,ARRAY[key],s,true),revision=revision+1 WHERE workspace_id=j.workspace_id;
 END IF;
 UPDATE public.brand_scan_jobs SET stage=stage+1,status=CASE WHEN stage=3 THEN 'completed' ELSE 'queued' END,stages=jsonb_set(stages,ARRAY[j.stage::text],jsonb_build_object('state','done','summary',_data)),sources=_sources,corpus=coalesce(_corpus,corpus),lease_token=NULL,lease_until=NULL WHERE id=_job;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION private.brand_sync_context() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.workspaces SET profile=coalesce(profile,'{}'::jsonb)||jsonb_build_object('brandBrain',NEW.sections),website=CASE WHEN NEW.website<>'' AND NEW.sections ? 'business' THEN NEW.website ELSE website END WHERE id=NEW.workspace_id; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.brand_claim(uuid),public.brand_retry(uuid),public.brand_checkpoint(uuid,uuid,jsonb,jsonb,jsonb,text,integer),public.brand_review_field(uuid,uuid,text,text,boolean,integer),private.brand_sync_context() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brand_claim(uuid),public.brand_retry(uuid),public.brand_checkpoint(uuid,uuid,jsonb,jsonb,jsonb,text,integer),public.brand_review_field(uuid,uuid,text,text,boolean,integer) TO service_role;