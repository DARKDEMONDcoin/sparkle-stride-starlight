# Brand Brain implementation and verification

## Data model
- `brand_brain`: one private row per workspace, website, four sections, revision and ten undo snapshots.
- Each section stores saved data, detected data, user-edited field names, per-field suggestions/ignored values, source, updated time and source URLs.
- `brand_scan_jobs`: workspace, website, requested section, sequential stage index/statuses, partial findings, read pages, bounded corpus, errors and a service-only lease token.
- Owners can read their rows. Mutations use authenticated server functions, explicit ownership checks and service-only RPCs. Employee context receives saved section data, never suggestions.

## Processing flow
1. Before signup, save the URL in the existing welcome draft and show deferred four-stage progress; retain the bounded anonymous preview.
2. A new-account-bound draft automatically enqueues after its workspace exists. Existing users begin with an empty Brand Brain.
3. Enqueue persists the job and wakes `/api/public/brand-scan` through the database row-change callback. The handler verifies its private token before accessing jobs.
4. Claim a 150-second lease. The first stage reads at most ten public same-site pages, respecting robots and pinned public IPv4 reads; each AI stage has a 60-second inference timeout.
5. Persist partial stage findings while reading/streaming. Checkpoint saved results atomically, preserve edited fields, queue the next stage and wake it after transaction commit. Identity uses declared CSS tokens, fonts and logo URLs.
6. Failures preserve prior completed stages. Expired or stalled jobs display recovery; explicit retry changes status and wakes the processor again. Credit/access denials pause work rather than silently switching models.
7. Dashboard/editor/sidebar poll persisted progress. The existing employee context builder reads the mirrored saved sections and retains workspace/message opt-outs; conversational reply language stays independent.

## Checks performed
- 17 targeted Brand Brain/context tests passed, including 75/100% completeness, public URL validation, robots rules, WCAG contrast, edited-field protection, ignored suggestions, all six slug round-trips, suggestion exclusion and website-context opt-out.
- Latest automatic application check: build OK.
- Actual GPT-6 Astra Responses call via the supported gateway SDK returned a validated business section from explicitly fictional text.
- Public welcome UI checked at 1280px and 375px; no horizontal overflow or browser errors. Public legacy employee URLs redirected to real-name slugs with employee-specific titles. Signed-out `/app/brand` redirected to sign-in.

## Remaining verification and limitations
- External unmanaged Supabase supplies no authenticated test session: owner save/readback, full persisted four-stage processing and all editor interactions have not been checked end-to-end in an actual account.
- The database wakeup targets the configured public application origin. The new callback must be deployed there before production background processing can be verified. No deployment was requested or performed.
- Wakeup is event-driven and best-effort, with explicit recovery of stalled jobs; no continuously polling scheduler or new paid queue is enabled.
- Automatic palette extraction currently uses declared CSS tokens; user-uploaded logo color extraction is available in the editor. Automatic logo/main-image color extraction is not implemented.
- Pre-existing leaked-password protection warning remains unrelated to these changes.