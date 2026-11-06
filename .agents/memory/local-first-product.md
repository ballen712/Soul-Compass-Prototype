---
name: Local-first product decisions
description: Approved registration-free architecture and consent boundaries for Soul Compass.
---

Soul Compass initially works without registration, Google sign-in, email OTP, Magic Links, passwords or mandatory Supabase sessions. Use the existing AsyncStorage dependency for a single versioned local profile, preferences, collection and privacy settings. The user has approved a paid Tarot reading feature in Explore, but the purchase model (one-time feature unlock versus per-reading credits) is still undecided. This does not approve ads or a storefront.

**Why:** the user approved a paid Tarot feature while keeping the main daily experience local-first and relatively free.

**How to apply:** preserve existing local records and legacy residence/birthplace separation. Keep cloud-only records untouched; starting a new local profile is acceptable. Do not automatically recover, download or merge cloud profiles. Export/import and optional accounts/sync remain future features. For paid native Tarot readings, use RevenueCat only after the user accepts its integration; keep all chart personalization on-device and never send birth details to the billing provider.

Preserve server-side astronomy calculations, but send personal birth inputs only after explicit, locally saved and revocable consent. Once current-version consent is granted, refresh the natal chart automatically once per app launch. Do not queue or retry requests on reconnection. No automatic profile upload or cloud synchronization.

**Why:** the user chose to retain the existing calculation engine and requested one-time consent for future automatic chart refreshes, while keeping that permission revocable.

**How to apply:** require the current consent version before dispatch, minimize payloads, request at most once per app launch, block future requests immediately on revocation and never queue offline birth-data sends. Renew consent when its meaning or frequency changes. Preserve the Supabase project, records, migrations, policies, protected endpoints and Replit secrets. Never weaken API validation, rate limiting, CORS or safe logging.
