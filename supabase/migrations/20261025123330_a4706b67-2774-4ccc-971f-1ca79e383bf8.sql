CREATE OR REPLACE FUNCTION public.ads_claim_job(p_job_id uuid, p_workspace_id uuid, p_account_id uuid)
RETURNS SETOF public.ad_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_now timestamptz := clock_timestamp();
BEGIN
  RETURN QUERY WITH candidate AS (
    SELECT j.id FROM public.ad_jobs j WHERE j.id=p_job_id AND j.workspace_id=p_workspace_id AND j.ad_account_id=p_account_id
    AND j.attempts < 5 AND ((j.status='queued' AND (j.next_attempt_at IS NULL OR j.next_attempt_at <= v_now)) OR (j.status='running' AND j.lease_expires_at <= v_now))
    FOR UPDATE SKIP LOCKED LIMIT 1
  ) UPDATE public.ad_jobs j SET status='running', lease_token=gen_random_uuid(), lease_expires_at=v_now+interval '60 seconds', attempts=j.attempts+1
    FROM candidate c WHERE j.id=c.id RETURNING j.*;
END $$;
REVOKE ALL ON FUNCTION public.ads_claim_job(uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ads_claim_job(uuid,uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.ads_checkpoint_job(p_job_id uuid, p_lease_token uuid, p_cursor jsonb, p_progress jsonb, p_status text, p_pause_reason text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_now timestamptz := clock_timestamp(); v_count integer;
BEGIN
  IF p_status NOT IN ('queued','paused','completed','failed') OR p_status IS NULL THEN RAISE EXCEPTION 'Invalid checkpoint status'; END IF;
  IF jsonb_typeof(p_cursor) IS DISTINCT FROM 'object' OR jsonb_typeof(p_progress) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid checkpoint'; END IF;
  IF pg_column_size(p_cursor)>65536 OR pg_column_size(p_progress)>16384 THEN RAISE EXCEPTION 'Checkpoint too large'; END IF;
  IF p_status='paused' AND (p_pause_reason IS NULL OR length(p_pause_reason)=0) THEN RAISE EXCEPTION 'Pause reason required'; END IF;
  UPDATE public.ad_jobs SET cursor=p_cursor, progress=p_progress, status=p_status,
    pause_reason=CASE WHEN p_status='paused' THEN left(p_pause_reason,200) ELSE NULL END,
    next_attempt_at=CASE WHEN p_status='queued' THEN v_now+interval '30 seconds' ELSE NULL END,
    attempts=CASE WHEN p_status IN ('queued','completed') THEN 0 ELSE attempts END,
    lease_token=NULL, lease_expires_at=NULL
  WHERE id=p_job_id AND lease_token=p_lease_token AND status='running' AND lease_expires_at>v_now;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count=1;
END $$;
REVOKE ALL ON FUNCTION public.ads_checkpoint_job(uuid,uuid,jsonb,jsonb,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ads_checkpoint_job(uuid,uuid,jsonb,jsonb,text,text) TO service_role;