---
name: Local-first product decisions
description: Approved registration-free architecture and consent boundaries for Soul Compass.
---

Soul Compass initially works without registration, Google sign-in, email OTP, Magic Links, passwords or mandatory Supabase sessions. Use the existing AsyncStorage dependency for a single versioned local profile, preferences, collection and privacy settings. Do not introduce paid services, analytics or payments.

**Why:** the user explicitly approved the complete local-first restructuring brief, superseding the earlier authentication-first and Google-only plans.

**How to apply:** preserve existing local records and legacy residence/birthplace separation. Keep cloud-only records untouched; starting a new local profile is acceptable. Do not automatically recover, download or merge cloud profiles. Export/import and optional accounts/sync are future features, not current scope.

Preserve server-side astronomy calculations, but send personal birth inputs only after explicit, locally saved and revocable consent. Once current-version consent is granted, refresh the natal chart automatically once per app launch. Do not queue or retry requests on reconnection. No automatic profile upload or cloud synchronization.

**Why:** the user chose to retain the existing calculation engine and requested one-time consent for future automatic chart refreshes, while keeping that permission revocable.

**How to apply:** require the current consent version before dispatch, minimize payloads, request at most once per app launch, block future requests immediately on revocation and never queue offline birth-data sends. Renew consent when its meaning or frequency changes. Preserve the Supabase project, records, migrations, policies, protected endpoints and Replit secrets. Never weaken API validation, rate limiting, CORS or safe logging.
