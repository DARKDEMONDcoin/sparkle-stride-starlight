# Media Buyer baseline increment — 25 October 2026

## Delivered, provider-independent
- Account Baseline page, account selection, explicit held/empty/error states, saved review start/resume, context notes with optional dates, stored learning list and manual bounded outcome review.
- Additive `ads_baseline_sources` staging table with owner-only reads, service-only writes, tenant-link checking, and resumable 500-row capture pages under existing atomic job leases. Report reads use sequential pagination, capped at 3,000 rows; exceeding the cap pauses, not silently completes.
- Account-specific daily quartiles, weekday summaries, spend concentration and funnel contracts; unknown lag suppresses mature conversion totals. No fabricated tracking, dimensions, campaign types, seasonality or hypotheses.
- Database triggers enforce Abdullah-only fresh ready verified baseline, entity coverage, compared evidence fields, new-account restrictions, major-change rebuild, approval decision, pre-change snapshot timestamps and post-learning/lag review timing. Existing rows are not rewritten; old/other employee paths remain outside these ads-table protections.
- Deterministic evidence-only Abdullah chat replies prevent model-generated recommendations while evidence is unavailable. Shared web/Telegram/email turns, skills, team-task execution and action dispatcher are covered; Adam remains unchanged. Smalltalk retains the existing flow; other Abdullah requests temporarily receive only the evidence report until structured generation is added.
- Outcome helper classifies comparable mature full-week evidence; manual saved-record review currently records only inconclusive results because verified post-change history is unavailable. Service-only atomic outcome RPC writes evaluation and learning once.

## Verification
- Focused baseline, endpoint ownership, reply and outcome tests passed; existing history, dashboard, settings and Pipeboard no-network regression tests passed.
- Live database inspection confirmed authenticated cannot execute staging/outcome RPCs and service_role can.
- Browser opened `/app/ads/baseline` without page errors but remained on existing loading screen. External unmanaged auth prevents account-backed visual and end-to-end verification; do not describe this as a verified signed-in flow.
- Preview builds passed after type corrections; no deployment and no advertising calls.

## Still blocked or incomplete
- Operational ready baselines require verified ingestion/provenance, conversion setup/lag, normalized weekly/dimensional evidence, actual landing-page audit data and full comparative reporting. Pipeboard is held; the saved-review endpoint intentionally never marks a baseline ready.
- Pre-change snapshot capture and approval-backed platform execution are not operational. The database blocks missing capture, but no live capture endpoint is activated. Structured recommendation/draft generation belongs to subsequent approved steps.
- Automatic refresh, full rebuild dispatch and scheduled outcome review await durable scheduling service/cost approval. Manual chunks only; no autonomous work runs after a request ends.
- No concurrent live record processing or trigger insert/update integration test with account records was performed.
- Two pre-existing security findings persist: RLS-enabled table without a policy; leaked-password protection disabled. These migrations introduced neither.

Step 4 is a provider-independent safety/report increment, not full operational completion. Stop before step 5 and obtain confirmation.