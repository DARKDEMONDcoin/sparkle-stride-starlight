REVOKE ALL ON FUNCTION public.brand_enqueue(uuid,text,text,boolean),public.brand_save_section(uuid,text,jsonb,integer),public.brand_undo(uuid,integer),public.brand_retry(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.brand_enqueue(uuid,text,text,boolean),public.brand_save_section(uuid,text,jsonb,integer),public.brand_undo(uuid,integer),public.brand_retry(uuid) TO service_role;
CREATE FUNCTION public.brand_owner_call(_owner uuid,_operation text,_payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb; ws uuid;
BEGIN
 ws=(_payload->>'workspaceId')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.workspaces WHERE id=ws AND owner_id=_owner) THEN RAISE EXCEPTION 'Owner access required'; END IF;
 PERFORM set_config('request.jwt.claim.sub',_owner::text,true);
 IF _operation='enqueue' THEN result=to_jsonb(public.brand_enqueue(ws,_payload->>'website',_payload->>'section',coalesce((_payload->>'replace')::boolean,false)));
 ELSIF _operation='save' THEN result=to_jsonb(public.brand_save_section(ws,_payload->>'section',_payload->'data',(_payload->>'revision')::integer));
 ELSIF _operation='undo' THEN result=to_jsonb(public.brand_undo(ws,(_payload->>'revision')::integer));
 ELSIF _operation='retry' THEN
 IF NOT EXISTS(SELECT 1 FROM public.brand_scan_jobs WHERE id=(_payload->>'jobId')::uuid AND workspace_id=ws) THEN RAISE EXCEPTION 'Job mismatch'; END IF;
 result=to_jsonb(public.brand_retry((_payload->>'jobId')::uuid));
 ELSE RAISE EXCEPTION 'Invalid operation'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.brand_owner_call(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brand_owner_call(uuid,text,jsonb) TO service_role;