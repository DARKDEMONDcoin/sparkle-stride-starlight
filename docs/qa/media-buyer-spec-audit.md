# Media Buyer full-specification audit — 24 October 2026

Source: the complete uploaded `Build_a_new_AI_Employee_Media_Buyer_paid_ads_pasted.md` (521 lines). This is an implementation audit, not confirmation that phase 1 works end to end.

## Matches to preserve
- Abdullah registration and public identity, existing employee chat/design patterns, scoped owner guidelines and saved default-off daily-audit preference.
- Additive advertising tables, owner-scoped access controls, tenant-link checks, immutable change-log foundation and admin-only API lifecycle settings.
- Provider selection using workspace overrides, environment configuration and Pipeboard as the default; third-party notice and connection/account display.
- Account-timezone history window helpers, micros conversion and exclusion of unreliable/immature rows from cached aggregates.
- Editable standalone prompt and playbook exist. TikTok and LinkedIn have coming-soon stubs.

## Partial or conflicting implementation
- Step 2 was previously marked complete, but no concrete Pipeboard adapter implements the full provider interface. Partner response/auth/tool contracts and declared capabilities remain unverified. Direct OAuth intentionally remains deferred by the owner's earlier decision, and Windsor has configuration but no complete adapter.
- `provider.ts` lacks required asset-group, change-history, conversion-lag, landing-page-metrics and conversion-setup contracts.
- `pipeboard.server.ts` has provisional endpoint/response handling; it must not be described as a tested integration. Per-account encrypted credentials, token refresh, callbacks and ingestion are not established.
- `history.functions.ts` reads cached campaign rows, not live platform history. Job tables and planned windows are not persisted resumable synchronization.
- Guardrail helpers test approval and budget rules but are not connected to a complete Abdullah mutation endpoint. Baseline fields and prompt instructions are not server enforcement of the evidence gate.
- Connections and cached history are currently embedded on the Guidelines page, not the full set of requested dedicated views.
- The playbook is one file, not the six verbatim sections requested. Prompt inclusion is all-or-none, not selective by task. The standalone prompt helper is not established as the complete employee-turn execution path.
- API health reports configured lifecycle metadata, not live provider connectivity. Existing Adam version paths remain unchanged by prior agreement.

## Build-order coverage
| Step | State | Remaining work |
| --- | --- | --- |
| 1 — Model, employee, guidelines, API health | Foundation built | Authenticated owner/admin flow verification and live API lifecycle validation |
| 2 — Connections | Partial, first incomplete step | Verified Pipeboard adapter/interface, credential isolation, discovery/callback flow; direct OAuth later per prior decision |
| 3 — Sync/dashboard | Preparation only | Incremental resumable 90-day daily/13-month weekly reads, changes/lag/page metrics, operation accounting, complete dashboard |
| 4 — Baseline/evidence/learnings | Schema only | Builder/report/progress, readiness/freshness/entity/evidence enforcement, new-account restrictions, outcome reviews |
| 5 — Analysis/audits/approval | Not operational | Grounded analysis, tracking/structure audits, recommendation cards and approval-backed writes with snapshots/validation/logging |
| 6 — Landing pages | Schema only | Ad-derived URL discovery, safe fetch/redirect/size rules, PageSpeed mobile/desktop, content audits, fix tickets and re-audits |
| 7 — Config playbooks/prompt | Partial files | Exact six-way split, legend, selective loading and integration into every relevant execution path |
| 8 — Intake/feasibility/Search/Meta | Not operational | Fourteen-field wizard, account-only prefills, economics confirmation, readiness checks, approved paused creation and final launch |
| 9 — Creatives/experiments | Schema/generic services only | Shared creative abstraction, concept diversity, multilingual limits/previews, gallery/individual approval and experiment lifecycle |
| 10 — PMax/Demand Gen | Not operational | Verified asset requirements and provider capability support, valid bulk creation, paused approval/launch lifecycle |
| 11 — Daily audit | Preference only | Approved durable queue service/cost, opt-in scheduler, incremental runs/reviews/weekly page checks, notifications and run history |

## Verification and blockers
- 31 focused tests across config, provider declarations, history helpers, guidelines and access checks passed.
- Six separate guardrail/prompt helper tests passed using a temporary test configuration. They do not prove a live approval flow.
- Latest available preview build log: `build OK` at 12:05 UTC. No application code, live advertising data or platform campaigns were changed by this audit.
- The project secret-name listing does not contain `PIPEBOARD_API_KEY`. This does not establish whether the separate `app_secrets` store contains it; that store was not queried during this audit. Earlier step-3 work reported no configured partner connection.
- Authenticated Pipeboard partner guide and actual hosted tool schemas are needed; do not invent contracts or advertise declared capabilities as verified.
- Earlier authenticated verification was unavailable for external unmanaged Supabase, and Vercel returned 403. Neither status was freshly verified by this audit; no publication was attempted.
- Preserve TanStack server functions/server routes rather than new Edge Functions, preserve Adam's existing workflows, and require owner confirmation between build steps. Adam remains outside Abdullah's new evidence gate.

## Next boundary
Obtain owner confirmation to finish step 2 using the verified Pipeboard contract and secure credential setup. Do not jump to steps 4–11 or activate paid scheduling. Complete and verify each step before requesting confirmation for the next.