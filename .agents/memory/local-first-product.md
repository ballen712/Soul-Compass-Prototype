---
name: Local-first product decisions
description: Approved registration-free architecture and consent boundaries for Soul Compass.
---

Soul Compass initially works without registration, Google sign-in, email OTP, Magic Links, passwords or mandatory Supabase sessions. Use the existing AsyncStorage dependency for a single versioned local profile, preferences, collection and privacy settings. The user has approved a paid Tarot reading feature in Explore, but the purchase model (one-time feature unlock versus per-reading credits) is still undecided. This does not approve ads or a storefront.

**Why:** the user approved a paid Tarot feature while keeping the main daily experience local-first and relatively free.

**How to apply:** preserve existing local records and legacy residence/birthplace separation. Keep cloud-only records untouched; starting a new local profile is acceptable. Do not automatically recover, download or merge cloud profiles. Export/import and optional accounts/sync remain future features. For paid native Tarot readings, use RevenueCat only after the user accepts its integration; keep all chart personalization on-device and never send birth details to the billing provider.

Preserve server-side astronomy calculations, but send personal birth inputs only after explicit, locally saved and revocable consent. Once current-version consent is granted, refresh the natal chart automatically once per app launch. Do not queue or retry requests on reconnection. No automatic profile upload or cloud synchronization.

**Why:** the user chose to retain the existing calculation engine and requested one-time consent for future automatic chart refreshes, while keeping that permission revocable.

**How to apply:** require the current consent version before dispatch, minimize payloads, request at most once per app launch, block future requests immediately on revocation and never queue offline birth-data sends. Renew consent when its meaning or frequency changes. Preserve the Supabase project, records, migrations, policies and Replit secrets; the user has since explicitly approved removing Supabase auth/cloud-profile code and its protected `/api/me/*` routes from workspace source. Never delete live data or weaken API validation, shared rate limiting, CORS or safe logging.

The natal-chart endpoint also requires `consentAccepted: true` and the current consent version on each request. Because the API is intentionally public and unauthenticated, these fields are a client declaration, not independent proof that the user saw or accepted the notice; no server-side consent record is created.

**Why:** On 8 November 2026, the user approved stateless server enforcement while recognizing that a public API cannot independently verify human consent or identity.

**How to apply:** check the declaration before birth-data validation and calculation, keep its version aligned across OpenAPI, mobile and server, and do not describe it as verified consent or add consent logging/storage.

First-run setup presents a short app introduction alongside birth details. Natal-chart permission is a separate, unchecked optional checkbox on that form; submitting without it must still let the user enter the app, and must not send birth data. Remove redundant first-run consent and guide popups; users who skip permission can grant it later from the Natal Chart screen.

**Why:** On 8 November 2026, the user chose one concise onboarding flow instead of repeating the data-processing explanation in a post-profile dialog.

**How to apply:** keep the checkbox explicit and unchecked by default, save it with the local profile before any chart request, disclose that changed birth details may be sent for recalculation, and keep withdrawal available in Settings.

On 8 November 2026, the user manually checked the Supabase dashboard: `public.profiles` exists but is empty; Auth Users and Storage are empty; the project is on Free and has no project backups.

**Why:** this is owner-reported live account state that cannot be established from repository code.

**How to apply:** treat it as a dated dashboard observation, not proof of migration/trigger state or a guarantee that records remain absent later.

The user chose to keep the published API public so the registration-free mobile app can reach chart and city-search endpoints.

**Why:** the current mobile app has no user sign-in, while those features depend on the backend.

**How to apply:** keep validation and shared rate limits enabled; do not restrict the API without first designing and approving another mobile access method.

On 8 November 2026, the approved API cutover was published to the existing public Autoscale deployment. Post-publish smoke checks passed for health, CORS, planetary positions, a synthetic natal chart, city search and validation; unauthenticated `GET /api/me/profile` now returns 404.

**Why:** this is verified live deployment state that cannot be inferred from workspace code alone.

**How to apply:** the protected Supabase profile route is no longer published, but do not remove Supabase secrets until the user separately approves their removal. No Supabase database migration or data change was part of the cutover.
