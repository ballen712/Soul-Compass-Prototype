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

On 8 November 2026, the user manually checked the Supabase dashboard: `public.profiles` exists but is empty; Auth Users and Storage are empty; the project is on Free and has no project backups.

**Why:** this is owner-reported live account state that cannot be established from repository code.

**How to apply:** treat it as a dated dashboard observation, not proof of migration/trigger state or a guarantee that records remain absent later.

The user chose to keep the published API public so the registration-free mobile app can reach chart and city-search endpoints.

**Why:** the current mobile app has no user sign-in, while those features depend on the backend.

**How to apply:** keep validation and shared rate limits enabled; do not restrict the API without first designing and approving another mobile access method.

On 8 November 2026, production API smoke checks passed for health, planetary positions, a synthetic natal chart and one city search. Unauthenticated production `GET /api/me/profile` returned 401, while workspace source returns 404, confirming the cleanup has not been published.

**Why:** this is a live deployment/source divergence that cannot be inferred from workspace code.

**How to apply:** treat legacy profile routes and their server credentials as still present in production until a separately approved publish is verified; do not remove Supabase secrets before that cutover.
