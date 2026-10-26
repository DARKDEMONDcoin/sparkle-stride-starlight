# Pipeboard connection readiness

## Public facts verified on 24 October 2026
- https://pipeboard.co/partners documents partner application/approval, a partner key and purchased account slots. An ordinary MCP API token does not establish partner entitlement.
- Partner examples establish POST `/api/v1/partners/users` with `external_user_id`, POST `/api/v1/partners/oauth/start` with `user_id` and `platform: facebook`, and the Meta MCP `X-Partner-User-Id` header. They do not establish full response schemas or Google partner authentication.
- https://pipeboard.co/partners/portal requires sign-in and holds the full integration guide.
- https://pipeboard.co/guides/meta-ads-mcp-server illustrates `get_ad_accounts`; https://pipeboard.co/guides/google-ads-mcp-api illustrates `list_google_ads_customers`. Public tool descriptions do not establish full hosted argument/result schemas, pagination or partner tenancy.

## Needed before activation
1. Approved partner integration guide: credential type/authentication, provisioning responses and idempotency, Google platform enum, OAuth state/callback/completion/reconnect/revocation.
2. Hosted tool schemas and account discovery responses/pagination, manager relationships, slot entitlement and per-tenant account visibility.
3. Partner credential supplied through the secure form after the correct credential and account-slot costs are confirmed. Do not paste a key in chat or upload it with documentation.

## Changes and checks
- All unimplemented provider capabilities are false. Onboarding and provisional Pipeboard transports reject requests before network calls, even if credentials are supplied.
- Provider configuration read errors stop selection instead of silently falling back.
- Disconnect cannot delete accounts/history and cannot claim successful revocation while the revocation contract is missing.
- Existing connections/cached history remain readable; Adam's workflows are unchanged.
- 27 focused tests pass across provider declarations, owner isolation, no-delete disconnect and no-network provisional transports. Latest preview build log reports build OK.
- Authentication status remains external_unmanaged; account-backed browser verification is unavailable. No live partner call, migration, advertisement change or deployment was performed.

Step 2 is still incomplete. Do not advance to the subsequent build step until a verified connection is implemented and checked.