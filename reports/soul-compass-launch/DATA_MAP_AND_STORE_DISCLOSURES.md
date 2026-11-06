# Soul Compass: data map and store-disclosure worksheet

**Prepared:** 6 November 2026  
**Status:** implementation-based working document; verify against the final signed builds and provider terms before submitting store forms.

## 1. Data currently handled

| Data | On device | Sent off device | Provider / persistence notes | Still to verify |
|---|---|---|---|---|
| Birth date, birth-time status/time, birthplace coordinates and time zone | Saved in the local profile; chart result cached locally | Sent to the Soul Compass API only after the locally saved astrology consent allows calculation | The API validates and calculates a response. The route does not write the request or chart to the profile database. App request logs record method, path without query string and response status, not request body. | Replit edge/platform log retention and actual production deployment logs. |
| Current residence and selected coordinates | Saved locally and used for daily guidance | Not part of the natal-chart request. A typed city query is sent only after the user taps Search. | The server forwards the query and fixed parameters to Geoapify, which returns city, country, coordinates and time zone. The end-user IP and headers are not forwarded; the provider sees server connection metadata. | Geoapify account-level settings and current retention terms; verify the live key's allowed domains and quota. |
| Language, daily feeling, collection, hidden stones and other preferences | Saved locally | Not sent in the natal request or city-search query | No account or cloud profile sync is active in the app UI. | Verify no new code path adds telemetry before release. |
| Device/network address | The app has no observed device-ID or analytics SDK | The API server sees a network peer address for a short-lived in-memory calculation limiter. The hosting platform may also process network metadata. | The city-search quota system uses keyed daily source digests and operational counters; project records say it does not store raw queries, raw end-user IPs or profiles. | Verify Replit infrastructure logs/retention and database cleanup schedule. |
| Crash diagnostics, analytics, advertising IDs | No active third-party analytics, ads or crash-reporting SDK was found in the app code inspected | No app analytics or ad event stream was found | OS, Expo, Replit or store-level diagnostics may be handled by those platforms outside this code. | Inspect final dependency/privacy-manifest reports and platform settings. |
| AI service inputs | None found at runtime | No birth/profile data is sent to an AI provider by the app | Crystal images are local bundled assets. | Verify the image-generation service's commercial-use terms and preserve provenance. |
| Supabase account/profile data | No active local UI flow uses it | No active profile upload/sync found | Auth modules, `/api/me` routes and a profile migration remain in the repository. The RLS SQL test says “Not yet run”; live Supabase settings/schema were not checked here. | Confirm Supabase signup/providers are disabled for this launch, or complete account deletion and test it. |

## 2. Security and retention facts

- API requests use HTTPS in the app's configured server URL. The server sets `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, JSON body limits and generic errors; it does not trust caller-supplied forwarded headers.
- API request logging omits query strings and request bodies. Do not infer that all Replit infrastructure logs have the same policy.
- City-query caching is in server memory. Persistent PostgreSQL is for operational quotas and keyed source digests, not profile or chart storage, according to the project implementation and documentation.
- Local app data is in AsyncStorage and is not encrypted at the application layer. The app's Settings warns that device backups may include it.
- There is no in-app full-profile erase or export/import flow in the inspected UI. The user can edit profile fields and can clear app data/uninstall, but a first-class reset control is not present.
- If consent is withdrawn, future calculations are blocked and an active request is aborted/discarded when possible. This cannot reverse a request that already reached the server.
- Geoapify policy notes in `artifacts/soul-compass/LICENSES_AND_DATA_SOURCES.md` describe short provider logging for successful requests, but error logging and the live account configuration still need verification.

## 3. Apple App Privacy worksheet — do not submit yet

The final answers depend on verifying platform/provider retention and the final binary. Do not mark “no data collected” merely because profile storage is local.

- **Accounts:** no active account creation/login flow in the mobile UI.
- **Data sent for a feature:** birth date/time status and birthplace location/time zone for chart calculation after consent; typed city text for city search.
- **Data stored persistently by Soul Compass servers:** no birth profile/chart database write found. Operational quota records are separate.
- **Data potentially available to processors:** Replit receives API traffic and runtime metadata; Geoapify receives typed city queries and server network metadata.
- **Tracking / advertising:** none found in the inspected app flow; re-check final SDKs and platform privacy manifests.
- **Linked to identity:** no app account or direct user identifier is sent with the chart request. Hosting/network logs can still have IP metadata; confirm actual retention before answering the store form.
- **Data deletion:** no cloud account profile is active. Local profile can be cleared by removing app data/uninstalling; no in-app reset/export exists. Provider/hosting retention needs confirmation.
- **Privacy URL:** absent from the app's own links and project files. Must be created and made public before submission.
- **Privacy manifest / SDK declarations:** inspect the final iOS archive and each shipped SDK before submission.

## 4. Google Play Data safety worksheet — do not submit yet

- Complete the form even if a category is ultimately declared not collected; use Google Play's current definitions and the final app build.
- Assess the birth-chart request and city search as data transmitted off-device. The right category and “collected/shared” answers require checking Google's definitions, provider roles and retention.
- Confirm whether data is encrypted in transit in the final release build and whether the policy link is reachable without login.
- The app does not create user accounts in the visible launch flow. If that changes, add an in-app deletion request and an external web deletion-request URL, and implement server/provider deletion.
- Ads declaration: no ads found in the current build. Re-answer if an ad SDK is introduced.
- Content rating, target audience and store listing declarations are not completed in this repository.

## 5. Privacy-law preparation (not a legal opinion)

Before offering the app to EU users, identify the controller and document the purposes, legal bases, recipients, retention, rights request process and security measures. Review GDPR Articles 5, 6, 13, 17, 20, 28, 32 and 44 with a qualified EU/Hungary privacy professional as applicable.

The consent control in the app is a useful product safeguard, not a guarantee of GDPR compliance. Confirm whether consent is the appropriate basis for each network purpose. Birth data is personal data; mood or spiritual preferences do not automatically become special-category data, but the context and inferences matter.

Review processor terms/DPA, subprocessors, data regions and transfer safeguards for Replit and Geoapify. Confirm how support requests, accountless local data and deletion requests will be handled. Consider a DPIA only if the final scope and scale make the processing likely to create high risk; obtain professional advice rather than assuming one is or is not required.

## 6. Facts that must be supplied or verified before final store disclosures

1. Controller/publisher legal name, country and public contact address.
2. Whether the publisher is an individual or registered business and who owns Soul Compass content/brand.
3. Intended minimum age / target audience.
4. Replit production and edge-log retention, database backup retention and actual deletion behavior.
5. Geoapify account settings, current terms, applicable DPA/processor role, retention and account-wide quota.
6. Whether any Supabase Auth provider remains enabled and whether any users have been invited.
7. Final production API hostname and how an App Store user can reach it without embedding a private Replit access token.
8. Final legal basis, user-rights process, international transfer language and local-language translations.
