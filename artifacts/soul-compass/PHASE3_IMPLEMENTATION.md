# Authentication and secure cloud profiles: implementation report

> Historical report for the dormant account implementation. The active app now uses local persistence without authentication. See LOCAL_FIRST_IMPLEMENTATION.html for current behavior.

## Implemented without external credentials

- Official Supabase SDK, Google browser PKCE flow and passwordless email-code flow. No custom password database or authentication algorithm.
- Session restoration/refresh, sign-out, API-expiry handling, guarded routes and visible loading/error/setup-pending states.
- Native sessions use chunked Expo SecureStore with device-bound accessibility; Web uses browser localStorage for Supabase sessions. Browser storage is not protected from XSS. There is no unencrypted native session fallback.
- Cloud profile API uses verified Supabase `getUser(token)` identity. Profile queries use the user's JWT and RLS, never an administrative key. No profile identifier is accepted from client input.
- Birth date, explicit known/unknown birth time, separate birthplace/residence with coordinates and IANA zones; language and crystal collection/preferences persisted in one owner row.
- Versioned updates reject stale writes. Sync on initial account load/reopen and explicit Sync now; no Realtime service or silent background merging.
- Legacy local import is opt-in and create-only. Conflicting cloud data is preserved. Local data is removed only after confirmed creation, or explicit completion after a fresh read confirms an identical interrupted import. Failed requests keep the local copy.
- Account transitions clear query caches and mask previous profiles immediately. Delayed previous-account responses cannot populate current account state.
- Confirmed deletion requires a recent sign-in and uses a server-only administrative client. Supabase Auth deletion cascades to the profile row. Unimported legacy local data is deliberately retained.
- Original local mode remains usable while Supabase is not configured. Configured cloud mode does not silently fall back to another user's local profile on auth/network errors.
- Existing COSMOS, CRYSTALS and NATAL layouts/navigation and validated Astronomy Engine calculations remain intact. Collection controls and account links were added without replacing those sections. Language/intention preferences are stored preferences, not a claim that existing sample readings are now translated/personalized.

## Database migration and policies

Created `supabase/migrations/202611040001_secure_profiles.sql`:

- `public.profiles`: one row per `auth.users.id`, default ownership from `auth.uid()`, FK `ON DELETE CASCADE`.
- Constrained profile/preferences JSON, version and timestamps; DB-side validation covers direct PostgREST writes as well as API validation.
- RLS enabled and forced; owner-only SELECT, INSERT, UPDATE and DELETE.
- No anonymous table privileges. Authenticated insert/update grants cover only profile/preferences, not owner/version/timestamps.
- Server-managed version trigger for conflict detection.

**Applied policies: none.** No Supabase credentials or project connection were supplied, so the migration/policies are prepared only. `supabase/tests/profile_rls.sql` is a rollback-only two-identity integration test to run after applying the migration. It has not yet run against PostgreSQL/Supabase.

## Changed file groups

| Files | Purpose |
|---|---|
| `artifacts/api-server/src/profiles/{service,router}.ts` | Verified identity, owner-only profile operations, conflicts and account deletion |
| API app/router/security middleware | Register private routes, PUT/DELETE CORS support, rate limiting and JSON checks |
| `lib/api-zod/src/profile.ts`, `index.ts` | Strict profile/preferences input validation |
| `supabase/migrations/…`, `supabase/tests/…` | Migration, RLS, DB checks and prepared live test |
| `artifacts/soul-compass/auth/*` | Supabase setup, auth/session context, secure storage and expiry events |
| `profile/{ProfileContext,cloud}.*` | Cloud persistence, migration, account isolation and preferences |
| `app/{sign-in,account}.tsx`, `app/auth/callback.tsx`, `_layout.tsx` | Auth/account screens and route protection |
| Existing onboarding/settings/crystals screens | Account links and real cloud collection controls |
| Expo `app.json`, package manifests, lockfile | SecureStore plugin and SDK/auth/test dependencies |
| API/client tests and Vitest configuration | Credential-free contract/lifecycle regression coverage |

The Astronomy Engine/natal calculation implementation was not changed.

## Verification results

- **25 API tests passed**, including the original astrology/security suite plus authentication contracts, two-account isolation, create-only import retry, stale writes, strict validation and verified-owner deletion.
- **10 client tests passed**: session/cache lifecycle, native storage, account switching, delayed-response isolation, opt-in/failed/conflicting/interrupted migration and reloading synchronized records.
- Workspace, API and Expo typechecks passed.
- Existing OpenAPI/client/schema generation passed.
- API build and Expo Web export passed (13 routes).
- Dependency, static security and privacy scans completed with **zero findings**. This is not proof of production readiness.
- The mobile-size browser journey passed: a local profile was created through onboarding, COSMOS/CRYSTALS/NATAL and settings worked, the Account setup-pending screen returned to the app, reload preserved the profile unchanged, and live natal/positions API calls returned 200 without routing/runtime errors. Only development bundling briefly delayed first-route rendering.

The API service double and SDK/storage mocks test contracts and lifecycle logic. They are **not** live authentication, separate real Supabase accounts, real devices or RLS enforcement. No failed assertion remains in the completed offline test suite. No Google/email-provider flow, live account deletion, live RLS or physical-device cross-device test is claimed as passed.

Two source checkpoints preserve the validated backend stage and the app/session-integration stage. Navigator identity changes also remount account-specific screens so component-local chart/form state cannot survive an account switch.

## Remaining limitations and external work

Follow `PHASE3_SETUP.md`. A free Supabase project, SQL migration, Google OAuth consent/client, email template/delivery configuration, redirect allowlist and secure environment configuration are required before real sign-in.

Cloud mode requires connectivity to load profiles; no sensitive cloud profile is cached persistently on the device. Browser sessions use localStorage, so preventing XSS and securing the browser/device remain important. Native Google callbacks require a development/standalone app build, not an assumption that Expo Go owns the custom scheme.

The existing in-process rate limit is bounded but shared by proxy peers and not distributed DDoS protection. Supabase has separate auth-rate/delivery limits. Hosted logs, provider retention/backups and production infrastructure settings were not audited. Account deletion removes active Auth/profile records, not a claim of instantaneous erasure from provider backups.

No paid service, subscription or commercial ephemeris was introduced. No plan was upgraded and no purchase was made. Supabase Free is suitable for limited early development within its quotas; public email delivery may need an approved existing/free SMTP provider. Nothing has been published or declared production-ready.
