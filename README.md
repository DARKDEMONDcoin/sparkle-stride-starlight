# Marblism Deep Dive

السلام عليكم، بص الموقع دة اعمل ديب سيرش عميق جدا جدا جدا عنة وكل حاجة عنة اعمل اقصي ديب سيرش عميق جدا جدا جدا عن الموقع دة :

https://www.marblism.com/?via=mariam-el-sayed&gad_source=1&gad_campaignid=23961736462&gbraid=0AAAABD_7tf2sdH5scTcfMwp2wlRO7oOJu&gclid=Cj0KCQjw79nUBhCgARIsADSHka3-UTqSDyqd38PpEzPEmYFilZNXSvrSyp_wJs8bsZS-fQD3VIf_S-0aAjvTEALw_wcB

وقولي احنا نقدر نعمل مثلة وافضل ازاي ولاحظ لا نريد تكاليف كلة مجاني لكن الأفضل ، اعمل ديب سيرش عميق جدا جدا جدا لكلة حرفياً وقولي هننفذ ازاي قولي فقط تناقش معايا ولا تنفذ شئ

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cd8afcaa-5cb1-477a-ba5e-5620deec22db).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Media Buyer migration — step 1

Extend the permanent employee `abdullah`; preserve Adam's existing advertising actions. New Media Buyer internal calls use authenticated TanStack server functions; OAuth/webhook/scheduler callbacks use server routes with caller verification. Browser-supplied workspace IDs are checked against the authenticated owner. No new Supabase Edge Functions.

The additive schema uses the existing `workspace_id` tenant convention, owner RLS, cross-tenant/account reference validation and an immutable `change_log`. Baselines, history, outcomes, tracking/structure/page audits, experiments, creative concepts, API usage and resumable `ad_jobs` are storage foundations only: no history pull, evidence-gate execution, provider adapter or scheduler is activated in step 1.

Abdullah uses existing employee-scoped `brain_items` guidelines. Daily audit preference is saved in `ad_guardrails`, defaults off, and does not execute anything yet. The API health panel is platform-admin-only; `user_roles` assignments are privileged provisioning, never user-editable. No administrator is auto-assigned. Authenticated owner settings read/write through RLS; server-generated evidence/job tables grant owners read access only.

`GOOGLE_ADS_API_VERSION` and `META_MARKETING_API_VERSION` are server-side overrides; absent overrides use the database version registry (initially v26 and v26.0). Health reports unknown/unverified lifecycles, uses a 90-day warning, and represents Google's tentative November 2027 sunset as month precision—not an invented exact date. Meta Marketing's sunset is unknown; Graph lifecycle dates are not substitutes. This is lifecycle/configuration checking, not a live provider connectivity test. Existing Adam API paths remain unchanged.

Next: configured `AD_PROVIDER_GOOGLE`/`AD_PROVIDER_META` (direct/pipeboard/windsor), tenant overrides, Pipeboard first and capability-normalized adapters. No provider is active for Abdullah yet; no credentials are requested at step 1. Provider consent and required partner/direct OAuth secrets will be documented when the provider is implemented. PageSpeed will require a server-only Google API key in the landing-page step.

Approved later orchestration: daily Vercel Cron plus a durable external queue calling verified TanStack routes; confirm the queue service and cost before setup. Persist progress, leases, backoff and denial pauses. The Vercel project requests 300-second functions; deployed duration/memory are unverified (settings read denied). Design small resumable chunks, not work after an HTTP response. No cron or queue runner has been installed.

## Media Buyer history increment — Pipeboard held

The owner authorized provider-independent work with Pipeboard inactive. `/app/ads/campaigns` reads genuine saved snapshots through owner-verified server calls, with bounded pagination, search/sort, trends, child entities, and visible missing/immature-data limitations. Financial totals exclude breakdown rows to prevent double counting. Internal history contracts distinguish daily/weekly periods and dimensions; they are not verified partner response mappings and are not yet an ingestion implementation.

`ads_claim_job` and `ads_checkpoint_job` are callable only by `service_role`; owners retain read-only job access. Claims acquire expiring tokens atomically, checkpoints reject stale tokens, and paused jobs are not automatically reclaimed. The internal history chunk helper processes at most three units within a 20-second starting-work budget. An eventual adapter must use bounded requests and durably upsert each unit before returning; idempotent ingestion remains unimplemented. The held entry point persists `provider_on_hold` without provider calls. No enqueue endpoint, scheduler, partner ingestion, or platform mutation is active.

Focused tests verify calculations, contracts, tenant rejection, chunk limits, resume cursors and no-network holds. Database grants were checked; signed-in account UI and concurrent database-job execution are not verified. Full historical sync, weekly/dimension storage, baseline/evidence enforcement and later specification steps remain outstanding.

## Media Buyer landing pages — provider-independent increment

`/app/ads/landing-pages` reads persisted ad-derived destinations only. Discovery consumes explicit internal `breakdowns.destinations` metadata (`finalUrls`, `expandedFinalUrls`, `destinationUrl`) in 100-row batches, not a fabricated provider payload mapping. No arbitrary-URL audit endpoint or live URL ingestion is enabled. Saved metrics remain unverified while Pipeboard is held; peer-opportunity helpers are not presented as verified account performance.

On-demand audits honor `workspaces.use_website_context`, check workspace ownership before credentials/privileged operations, resolve public IPv4 addresses through Google DNS-over-HTTPS and pin the connection while preserving Host/TLS SNI. Only HTTP(S), public hostnames, no credentials/sensitive query parameters, at most five redirects, a 15-second page-read budget and a 512,000-byte HTML cap are allowed. IPv6-only destinations fail closed. Raw HTML is discarded after bounded structure extraction; login forms stop analysis. This uses static HTML, not browser rendering, and never submits forms or confirms tags fire.

Set `PAGESPEED_API_KEY` in server secrets (existing `getSecret` store/runtime fallback). The owner requests mobile and desktop independently. Each request has an 18-second PageSpeed timeout and an atomic five-minute page cooldown; errors/quota/key absence persist as explicit limitations without automatic retry. URLs are sent to Google DNS/PageSpeed for these checks. Results separate Lighthouse lab data from page-level real-user p75 fields; missing field data stays unknown, never replaced by lab values. No aggregate "passed" score is invented.

Structured content analysis uses the existing shared model service, only after the account evidence gate passes. Missing ad copy, keywords/search terms, rendering, event validation and outcome evidence stay explicit. Fix tickets are private, service-written, baseline-gated records separate from advertising recommendations; owner implementation confirmation does not edit a website or assert success. Re-audit controls are available, but automatic re-audits, lag-adjusted outcome dispatch, screenshots and live metrics remain incomplete. No scheduler, direct OAuth, Pipeboard connection or deployment is activated by this increment.

## Media Buyer editable instructions — step 7

Canonical playbook content is now in `src/lib/ads/playbook/{core,google,meta,landing-pages,diagnostics,creative}.md`, preserving the full uploaded section 14 verbatim, including the legend. Edit these six files, not the older partial `media-buyer-playbook.md` (retained solely as a legacy reference; no longer imported). `src/lib/ads/prompts/system.md` preserves the section 13 base instructions; `landing-audit.md` contains the existing read-only checklist output contract. No prompt text lives in UI components.

`src/lib/ads/playbook.ts` selects core for every task, platform sections only for known Google/Meta account scope, landing pages for page work or explicitly weak conversion, diagnostics for analysis/audits/outcome review, and creative only when writing ads. `buildMediaBuyerPrompt` preserves owner guidelines, supplied business/account context and baseline attachment points. Unknown scope loads core only, never assumes a platform. Future analysis/draft/creative entry points must pass explicit scope rather than infer account identity from user text.

The active gated page-analysis model call now uses this composer with server-read account scope, employee-scoped owner guidelines and saved baseline context; missing page/ad/keyword inputs remain explicit. Abdullah's smalltalk model path loads the base system/core instructions. Non-smalltalk web/Telegram/email turns, skills and team tasks still return deterministic evidence reports; they do not call a model while evidence/provider work is incomplete. Adam and other employees retain their existing playbooks. Editing instructions cannot authorize execution or override database evidence/approval gates. No deployment or live provider activation was performed.
