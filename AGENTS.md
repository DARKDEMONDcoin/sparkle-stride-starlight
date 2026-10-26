<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Platform keys stay server-only; user credentials remain encrypted.
- Social outputs use `src/lib/post-format.ts` across site, queue, and Telegram.
- Browsers share persistent stops; sensitive intents need owner approval. Why: avoid denied calls.
- Multi-step browsing uses `browser-agent.server.ts`; page content is untrusted and sensitive clicks need approval.
- `runEmployeeTurn` delegates out-of-specialty work via smartHandoff while keeping the conversation.
- Employee tools live in `employee-toolbelt.ts`; browser tasks stop before payment.
- Chat action commands use `chat-commands.ts`; edits use `reviseEmployeeAction`.
- All employee paths derive research depth, reasoning effort, risk, and success checks from `src/lib/turn-plan.ts`; this prevents conflicting execution decisions.
- Telegram actions and manual credentials stay in-chat; no flow depends on website deep links.
- Brand data is optional per turn via `src/lib/brand-relevance.ts` (opt-out/opt-in from recent user messages); forcing the brand name into every post broke user intent.
- Messages.outputs retains full chat deliverables; drafts enter tasks only by user choice, while pendingAction retains sensitive execution approval across refreshes. Why: viewing work must not require a queue.
- Semantic memory lives in `knowledge_chunks` (google/gemini-embedding-2, 3072 dims) via `src/lib/knowledge.server.ts`; never mix embedding models in that column.
- Public site origin comes from `src/lib/site-origin.ts`; do not hard-code other lovable.app hosts.
- Chat research requests run `runBrowserAgent` inside the turn and stream `browser`/`step` events to the chat; employees never redirect users to colleagues (routing is silent). Why: users need real results and live visibility, not hand-off ping-pong.
- Signup CTAs enter /welcome then /auth; external Google OAuth returns to public /auth before /app. Bind website drafts only to new accounts. Why: preserve introduction and invite intent without cross-account reuse.
- Pre-signup previews read few same-site pages, then one rate-limited, host-cached AI pass. Why: bounded anonymous cost.
- Website swatches use declared theme and same-site brand tokens, not color frequency or defaults, to preserve branding.
- Pre-signup recommendations: short, rate-limited, validated, grounded in sector/public site; no implied metrics.
- Welcome purpose variants live in a browser-safe shared module used by every tour/recommendation path, avoiding business-only claims.
- Chat capabilities and owner guidelines derive from shared skills; guideline rows are scoped to one employee.
- Each workspace has one persistent conversation per employee across web/Telegram; preserve history and unread state.
- Website context is controlled by one workspace-level switch that every employee execution path must honor.
- Chat voice dictation records in the browser and streams transcription through the authenticated `/api/transcribe` route into the draft (never auto-sends). Why: users review spoken text before it reaches an employee.
- Team workspace = real human members (invite-bound) sharing projects/tasks; tasks may also be assigned to one digital employee run via `collab-ai.functions.ts`, and activity is written only by DB triggers. Why: shared human+AI board without exposing owner-private data.
- Team spaces share employee chats: stream route verifies membership, runs turn via admin client; messages store sender. Why: shared human+AI threads.
- Project spaces get a team block (members + sender) in employee turns; stream passes verified client+sender. Why: chats address the team.
- Referrals: scoped Ziad styling; preserve codes, verified payments and refund maturity; no user-written earnings.
- Feedback/support: private RLS.
- Settings use router search.
- Employee IDs: permanent (DB/URLs).
- Brand references stay bounded/private and sanitized; why: protect sources.
- Brand extraction uses safe schemas; competitor-research ranks direct substitutes with literal buyer/offer proof from both sites. Why: precision.
- Keep gateway keys registered in storage/hosting; research preserves service errors. Why: stale keys broke analysis.
- Webhook/login/OAuth origins default to `SITE_ORIGIN`; Vercel maxDuration set in vite.config. Why: old hosts are dead.
- Publish via `bun run scripts/deploy-vercel.ts` (uploads every file, then creates the production deployment and waits for READY). Why: GitHub→Vercel sync is broken and the CLI rejects the team-scoped token ("User not found").
- Read-only employee actions (`src/lib/read-only-actions.ts`) run inside the turn without approval and the reply is rewritten from their real result. Why: reads need no consent and the model invented inbox content.
- Employee email (`employee-email.server.ts`): Svix + DKIM/DMARC checks, idempotent `inbound_emails` rows, Resend replies as the employee. Why: unbroken threads.
- Chat documents: private bucket + `attachments` table; `chat-files.server.ts` feeds relevant chunks into later turns. Why: follow-ups without re-upload.
- Media Buyer uses TanStack server functions for app-internal logic and authenticated server routes for external callbacks, not new Supabase Edge Functions; this preserves the existing server architecture and its security boundaries.
- Media Buyer extends existing workspace tenancy and brain-item employee guidelines; cross-record tenant validation and server-generated evidence permissions protect isolation without replacing existing employee flows. API lifecycle config is admin-only and distinct from live provider connectivity; unknown sunset dates stay unknown.
- Media Buyer historical reads use owner-verified cached snapshots and account-local closed-day windows; only complete normalized mature data contributes to totals. Keep provider wire contracts unimplemented until verified against the partner guide and hosted tool schemas, to prevent fabricated integrations.
- Media Buyer campaign dashboards exclude dimensional breakdowns from aggregate totals and preserve missing-day gaps; history jobs use service-only atomic leases/checkpoints, bounded batches, and persistent provider holds without automatic dispatch. Why: prevent double-counted spend, duplicate work, and false live-sync claims.
- Media Buyer connection entry points and provisional transports fail closed until contracts and tenant binding are verified; capabilities represent implemented support, and disconnect must revoke provider access without deleting account/history rows. Why: credentials alone cannot establish safe connectivity or preserve evidence.
- Abdullah evidence protection uses database write triggers and deterministic baseline reports across shared chat, skills, team tasks and action dispatch; baseline reviews stage bounded pages under service-only leases and never infer verified ingestion from cached rows. Why: prompts and caller-supplied evidence cannot authorize recommendations or live changes; keep Adam unchanged.
- Media Buyer review decisions use a service-only atomic owner-verified RPC with proposal-version checking and private decision history; unknown audit coverage has no score, and approval/execution stay unavailable without verified current-state evidence. Why: edits, human consent and real platform execution are distinct states.
- Media Buyer landing-page audits accept persisted ad destinations only, honor workspace website context, pin vetted public IPv4 connections with bounded redirects/bytes, and retain structured evidence without raw HTML; page-fix tickets remain separate from advertising changes and require verified historical baselines. Why: prevent SSRF, evidence bypass and implied website execution.
- Abdullah's model prompts use the editable system text and six canonical playbook files through task/platform section selection; deterministic evidence-only paths never fall through to generation, and Adam keeps his existing playbooks. Why: preserve the full specification while limiting task context without weakening server safeguards.
- Media Buyer campaign drafts follow intake → feasibility → lessons → owner-approved plan → paused creation → separate launch confirmation, enforced by DB transition triggers; intake rules live in browser-safe `src/lib/ads/intake.ts` with no country/language/currency defaults. Why: no step can be skipped and currency comes only from the ad account.
