# New AI employee: Abdullah (عبدالله) — Media Buyer

Build a 7th employee who manages paid ads on Google Ads and Meta (Facebook + Instagram). He reads real account data, explains it simply, proposes improvements, and drafts new campaigns. He never changes a live campaign or spends money until the owner approves, and the server enforces that rule, not only the AI's instructions. TikTok and LinkedIn show as "Coming soon".

## What the owner gets
- **Abdullah in the team**: a catalog card, a public guide page, and chat, all built like the other employees.
- **Abdullah's workspace** with tabs: Chat, Campaigns, Recommendations, Drafts and Creatives, Guidelines, Connections.
- **Connections**: "Connect Google Ads" and "Connect Meta Ads" buttons, more than one ad account per business, a status for each (connected / expired / error), a reconnect prompt, and a disconnect button.
- **Business intake (step-by-step popup)**: the 12 fields from the brief. No country, language or currency is filled in ahead of time; currency and timezone come only from the connected ad account. A website link fills in a summary the owner can edit. Abdullah won't draft a campaign until the required fields are done, and he asks in chat when something doesn't add up (for example, a tiny budget for a huge audience).
- **Analyze account**: last 30 days (adjustable) compared with the period before. It finds the best and worst campaigns, ads and keywords, wasted search terms, tired creatives, budget pacing, and tracking problems. Abdullah gives a plain summary in chat and saves recommendations that show the real numbers, the reason, the expected impact and the risk. If there isn't enough data, he says so.
- **Recommendations queue** (also inside chat): Approve / Reject / Edit, a before/after view, and "approve all low-risk". Budget increases always need one-by-one approval. Built-in limits: at most +20% budget per change, never above the monthly cap, and never switching on a whole campaign without approval.
- **Campaigns from scratch**: intake → campaign plan for approval → copy and images → approval → created **paused** on the platform → final "Launch" screen showing total budget and schedule.
- **Native copy in every chosen language**, with live character counts. Images reuse the same image tool the other employees already use, in 1:1, 4:5, 9:16 and 16:9.
- **Guidelines**: free text that goes into Abdullah's instructions on every run, plus a "Run a daily campaign audit" switch (off by default). The daily audit only creates recommendations and notifications; it never applies changes.
- **Full history** of every applied change: who approved it, before and after, and what the platform answered.

## How it's built (adapted to this platform)
- Server logic lives inside the app (like every other employee), not in separate edge functions. Same security result: ad keys never reach the browser.
- AI calls go through one shared `callLLM` helper that uses the platform's current AI service (Gemini by default). The model can be changed in settings. The AI has read-only and drafting tools only; there is no "apply change" tool.
- The base instructions from section 11 of the brief are kept in an editable, versioned file.
- Everything stays in the current Gulf Modern look, Arabic and English, right-to-left.

## Decision needed: how ad accounts connect
1. **Direct Google/Meta login (what the brief asks for).** You must supply a Google Ads developer token (Basic access needs Google approval, usually days to weeks) and a Meta app with Advanced Access to `ads_management` (needs Meta App Review). Until those approvals arrive, it only works on test accounts.
2. **Reuse the existing connector (Pipedream)**, which Adam already uses for ad reports. Faster, but blocked until Pipedream moves to a paid plan.

Both are built behind the same connection layer, so switching later doesn't touch Abdullah himself. The proposed default is to build option 1 now and keep option 2 as a fallback.

## Delivery order
1. Data tables + security, the connection layer, Connections tab, Abdullah registered in the team and guide pages.
2. Intake popup, website summary, Guidelines + daily-audit switch.
3. Analyze account, Campaigns view, Recommendations + server-side approval check + limits + change history.
4. Campaign drafting (Google Search, Meta), creatives gallery, the "paused, then Launch" flow.
5. Daily audit job, notifications, tests for every rule (+20% cap, monthly cap, no change without approval, no default country), README listing the keys you provide, then publish.

## Technical details
- Tables (each limited so a workspace only sees its own rows): `ad_connections` (tokens stored in Vault, only a reference in the row), `ad_accounts`, `business_profiles`, `campaign_snapshots`, `recommendations`, `campaign_drafts`, `change_log` (insert only, no updates or deletes), `audit_runs`, `ad_guardrails`.
- `src/lib/ads/provider.ts`: the `AdPlatformProvider` interface; `google-oauth.server.ts`, `meta-oauth.server.ts`, `tiktok.stub.ts`, `linkedin.stub.ts`; a `pipedream.server.ts` adapter as a future third-party provider.
- OAuth callbacks at `/api/public/ads-oauth/{google,meta}` that check signed state. Tokens refresh automatically; on failure the connection is marked expired.
- The mutation server function requires an `approved` recommendation or draft for the same workspace, checks the limits, runs a dry run (Google `validateOnly`, Meta `execution_options=validate_only`), applies the change, writes `change_log`, then sets the status to applied or failed.
- Meta Graph is upgraded to v26 through the shared `graph-version.ts`. Google Ads API v25. Rate limits are handled with backoff and paging, and snapshots are cached.
- Daily audit: a pg_cron job calls `/api/public/ads-daily-audit` with a secret header.
- Employee id `abdullah`: added to `src/data/team.ts`, the skills file, the `team-knowledge` guide, and the routing/referral rules (ads work moves from Adam to Abdullah; Adam keeps reporting and analytics).
- Secrets you supply: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_OAUTH_CLIENT_ID/SECRET`, `META_APP_ID/SECRET` (the existing Meta app may be reused).
