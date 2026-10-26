# Media Buyer step 1 verification — 26 October 2026

Scope: close documentation and verification gaps only. The owner approved retaining the existing authenticated TanStack layer. No application behavior, schema, roles, customer preferences, provider calls or deployment changed.

## Verified
- Current Supabase schema has all specified advertising tables with RLS. Step 1 `brain_items`, `ad_guardrails`, `ads_api_versions` and `user_roles` have authenticated read and service-role grants.
- Live policies require workspace ownership for guidelines/guardrails, `ads_is_admin()` for the version registry and own-user access for role reads; role assignments are not user-editable.
- Existing tests reject non-owner requests and deny a workspace owner without the protected admin role before registry access.
- Added handler tests verify default-off reads, true/false preference save and readback within a stateful mocked client, save failure propagation, authorized admin registry reads, unknown sunsets, unregistered overrides and role-verification failure.
- Registry defaults inspected during the comparison: Google v26, tentative November 2027 sunset; Meta Marketing v26.0 with unknown sunset. These registry records are not live provider health results.
- Existing employee-scoped guideline filtering excludes disabled rules and other employees; only the active model path consumes them. Non-smalltalk reports remain deterministic and evidence-only.

## Checks
Run `bunx vitest run src/test/ads-settings-security.test.ts src/test/ads-config.test.ts src/test/ads-guidelines.test.ts`.

The 18 focused checks passed. Mocks exercise real handler logic, not real OAuth/session, hosted RLS or a browser save. Read-only schema inspection verifies installed policy definitions/grants, not their execution under a real owner/admin session.

## Still blocked
- Signed-in owner guideline save/disable/readback and audit preference readback through the UI.
- Signed-in platform-admin health view and non-admin denial under hosted RLS.

The external unmanaged Supabase project supplies no test session. No credentials were requested, and no privileged role or customer setting was manufactured for testing. Existing live advertising connectivity remains held; it is a step 2 concern.

## Stop boundary
Step 1 documentation and automated verification increment is complete; step 1 authenticated end-to-end completion is unverified. Stop before step 2 and request owner confirmation before any connection implementation. Preserve all working behavior and use additive migrations when a later approved step needs schema changes.