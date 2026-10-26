# Complete Media Buyer with Pipeboard on hold

## Scope and boundaries
- Extend Abdullah using the existing employee design, chats, workspace protections, and Arabic/English presentation. Preserve working features and Adam’s existing workflows.
- Keep Pipeboard inactive. Do not replace it with direct OAuth, buy account slots, or request partner credentials during this work.
- Build the remaining provider-independent workflows in specification order. Summarize and request confirmation after each step, as required by the specification.
- Without verified connectivity, live account downloads, platform validation, campaign creation, and launching remain blocked. Saved-data workflows may operate on real stored records; never fabricate account metrics or present fixtures as connected data.

## Delivery sequence

### Next: step 3 — history and Campaigns dashboard
- Complete normalized history contracts for campaigns, child entities, changes, conversion lag, conversion setup, assets, and landing-page metrics without guessing Pipeboard’s transport.
- Add bounded, resumable job orchestration with stored checkpoints, leases, progress, retry limits, and persistent pause reasons. Keep provider-dependent jobs blocked while connectivity is on hold; do not show them as successfully synchronized.
- Expand the Campaigns view into a dedicated employee view with account selection, date windows, sortable/filterable campaigns, trends, quality/maturity indicators, and available ad/keyword/asset details.
- Preserve account-local closed-day windows, 90-day daily/13-month weekly planning, micros normalization, and exclusion of incomplete/unreliable/immature financial totals.
- Test real saved-data access where possible and explain verification limitations. Stop for confirmation before step 4.

### Step 4 — baseline and evidence protection
- Build baseline/report/progress workflows from normalized stored evidence, including tracking quality, account benchmarks, seasonality, changes, user context, conversion lag, limitations, and at most five context questions.
- Enforce ready/fresh/entity-covering evidence before saving recommendations or historical-account drafts; a building baseline permits questions, not recommendations.
- Enforce new-account restrictions, maturity rules, historical lessons, success metrics, review dates, and pre-change snapshots. Add outcome evaluation and learnings with honest inconclusive/confounded classifications.

### Step 5 — analysis, audits, recommendations, approvals
- Add evidence-grounded analysis, Tracking Health and Structure Audit views, recommendation cards in the workspace and chat, editable proposals, and approval/rejection records.
- Enforce individual approval for budget increases, maximum +20% per change, monthly cap, learning warnings, no stacked major changes, and fresh pre-change evidence.
- Separate human approval from platform execution: approval never implies a live change occurred. Execution must reject unavailable providers, validate before applying, and record actual responses and created IDs when verified connectivity returns.

### Step 6 — landing pages
- Add account-owned discovered URL records, page metrics, ranked opportunities, audit findings, developer-ready fix tickets, and re-audit/outcome workflows.
- Implement bounded public-page auditing with redirect-by-redirect SSRF protection, no credentials, timeouts/size limits, mobile/desktop PageSpeed, explicit lab/field limitations, and transient HTML handling.
- Only audit URLs proven to originate in the customer’s ads. Missing discovery evidence remains a blocker, not permission to fetch arbitrary URLs.

### Step 7 — editable playbook and prompt
- Preserve the uploaded Playbook verbatim in six editable sections: core, Google, Meta, landing pages, diagnostics, and creative, including its legend.
- Load core on every task, platform sections only when relevant, diagnostics for analyses, pages for page work/weak conversion, and creative for copy/assets.
- Integrate the editable prompt and scoped guidelines into Abdullah’s web, Telegram, and shared-team execution paths without changing other employees.

### Step 8 — intake, feasibility, campaign drafts
- Implement the complete fourteen-field wizard, saved-profile review, account-only currency/timezone prefills, market/language choices without defaults, and editable website enrichment.
- Validate economics, owner-confirmed allowable CPA, tracking, landing-page readiness, and historical lessons before a plan is proposed.
- Add editable Google Search and unified Meta Advantage+ plans, separate plan/creative approvals, paused-creation state, and separate final launch confirmation with budget/schedule.
- Saving and approving internal drafts may work without Pipeboard; paused creation and launch remain unavailable until a verified provider exists.

### Step 9 — creatives and experiments
- Reuse existing media services behind a shared advertising creative abstraction; prioritize uploaded brand assets.
- Add native multilingual copy, character limits/previews, concept diversity, ratio-aware assets, private gallery, individual approvals, disclosure checks, and planned experiment/outcome tracking.

### Step 10 — PMax and Demand Gen
- Add planning and asset-readiness workflows grounded in officially verified requirements for the configured API version.
- Require complete valid assets, healthy tracking, relevant account evidence, and explicit approvals. Provider creation stays blocked until verified support exists; never advertise unsupported capability.

### Step 11 — daily audit
- Implement opt-in recommendation-only orchestration, incremental baseline refreshes, due reviews, weekly page checks, notifications, and run history.
- Keep automatic execution inactive until the durable queue service, costs, credentials, and hosting access are confirmed. Turning the audit preference on must not falsely imply a running schedule.

## Technical details and verification
- Use TanStack server functions for internal operations and authenticated TanStack server routes for external callbacks; no new Supabase Edge Functions.
- Preserve workspace tenancy; authenticate and authorize every private endpoint, use RLS for ordinary reads, and validate cross-record workspace/account links.
- Use additive migrations only. Include explicit grants for every public table, then RLS and policies. Evidence and immutable change history cannot be user-forged.
- Provider implementations stay server-only; the LLM receives read/draft tools, never apply/launch tools. Preserve configurable API versions and existing AI/media model choices.
- Bound each job invocation and outbound concurrency, use database leases and idempotent checkpoints, and persist terminal provider denials. No idle polling or immediate self-invocation loops.
- Add focused tests for every business rule and exercise each available user flow. Distinguish helper tests, saved-data verification, live provider verification, and deployment.
- Update documentation and the roadmap after each step. Do not claim completion or deployment based only on scaffolding or preview checks.

## External blockers retained
- Pipeboard onboarding, ingestion, revocation, dry runs, writes, paused creation, and launch: explicitly on hold.
- PageSpeed service key and any required AI/media service access: obtain securely only when needed; never paste secrets into chat or code.
- Paid durable scheduling: service/cost confirmation required before activation.
- Signed-in account verification and Vercel publication: previously unavailable; recheck when those steps become actionable. This request does not itself authorize publication.