# Soul Compass launch-preparation package

**Status:** working drafts, prepared 6 November 2026. These files are not legal advice, are not approved for publication, and must not be presented as final store disclosures while bracketed items remain.

## Recommended release route

Prepare both platforms in the codebase, but release **iOS first** through Replit Expo Launch and TestFlight. This matches the owner's current iPhone testing and the supported Replit submission flow. Reconsider Google Play after iOS testing and demand are known. Do not pay for both developer accounts now.

Keep user profiles local and registration-free. Cross-device sync is not required to launch; consider a local export/import flow later. Do not add an access token or provider secret to the Expo client.

## Important access and cost warning

Replit's deployment service reported an active, successful **public Autoscale deployment** on 6 November 2026. The owner asked to restrict it. Replit's documented flow is to unpublish, select a private sharing option such as Workspace only or Invite only, and publish again. This interrupts the current public URL. It may also block external requests to `/api` if the mobile frontend and API share the deployment.

The agent cannot change deployment visibility through the available project controls. The owner must perform the Publishing action. Do not embed a Replit external-access token in the app: a token in a mobile bundle is not secret. Before App Store release, decide how the account-free app will reach a protected, production API. A public API needs robust abuse limits and safe handling; private workspace-only access is not a substitute for public app-user authorization.

Replit's August 2026 billing documentation describes Autoscale charges as a monthly base plus compute and request usage. Production PostgreSQL is billed for compute and storage; scheduled backups have separate storage charges. The existing active deployment may continue to incur usage costs. The account's actual bill and database backup configuration have not been inspected.

## Verified product and data facts

- Expo / React Native mobile app; bundle ID `app.soulcompass.mobile`; iPhone-only setting; app version `1.0.0`.
- First launch shows a local language chooser with English, Hungarian, Italian, German, French, Spanish and Russian.
- No sign-up or sign-in is required by the active app. Profile, residence, preferences, daily feeling and crystal collection are stored locally using AsyncStorage. Local storage is not encrypted by the app; device backups may include app data.
- Natal calculations are made by the Express API only after locally saved consent. The client sends birth date, birth-time status and, when known, local time, plus birthplace coordinates and time zone. It does not send the user's name, current residence, language, feeling or crystal collection for that calculation. The chart is cached locally. Requests are not queued for later after an offline failure. The user can withdraw consent; a request already sent cannot be recalled.
- City search runs after the user taps Search. Only the entered city query and fixed search parameters go from the server to Geoapify. No device GPS, profile or end-user IP/header is forwarded. Geoapify receives normal server connection metadata.
- Project records describe Replit PostgreSQL as operational quota storage, not profile storage. The Supabase Auth/profile modules and RLS migration exist in the repository but are not used by the active local-first UI.
- No ad, analytics, in-app purchase or runtime AI provider was found in the active app flow. AI crystal illustrations are bundled locally.
- Support email configured in the app: `soulcompass.support@gmail.com`.

## Documents in this folder

- `DATA_MAP_AND_STORE_DISCLOSURES.md` — implementation-based data map and unresolved Apple/Google disclosure questions.
- `PRIVACY_POLICY_DRAFT.md` — English policy draft with publication blockers called out.
- `PRIVACY_POLICY_DRAFT_RU.md` — Russian working translation to help review the English draft; not legal-reviewed.
- `TERMS_OF_USE_DRAFT.md` — non-final terms outline for the current free, accountless app.
- `TERMS_OF_USE_DRAFT_RU.md` — Russian working translation; not legal-reviewed.
- `SUPPORT_PAGE_DRAFT.md` — support-page copy that avoids asking users to email birth details.
- `LAUNCH_ROADMAP.md` — platform decision, cost notes and pre-release sequence.

## Do not publish until these are resolved

1. The owner supplied the operator name, country, public contact address and selected a 13+ intended audience. Confirm individual-versus-business status, ownership, child-consent rules and age ratings with qualified counsel.
2. Verify Replit, Geoapify and any other provider's data locations, subprocessors, log retention, applicable agreements/DPA and transfer terms. Confirm actual production quota-database retention and backup configuration.
3. Review the legal bases and user-rights process with an EU/Hungary privacy professional. Do not describe the app as GDPR-compliant based on these drafts.
4. Confirm the current public deployment has been restricted if private testing is still the goal. Do not share its public URL in the meantime.
5. Decide the production API access model and verify the actual iOS build embeds the stable production endpoint.
6. Add an in-app link to the final privacy policy and publish the same policy at a stable HTTPS URL.
7. Localize and proofread privacy/support materials for all seven app languages, or clearly limit the corresponding store-language claims.
8. Reconcile Apple App Privacy and Google Play Data safety answers against the final shipped binaries, provider contracts and production logs.
9. Confirm commercial rights for generated images, the name/brand and all content assets.

## Current project evidence

- Expo compatibility report: `artifacts/soul-compass/EXPO_COMPATIBILITY_VERIFICATION.md` (last report dated 4 November 2026; it is not a signed release-build result).
- App configuration: `artifacts/soul-compass/app.json`.
- Privacy and consent implementation: `artifacts/soul-compass/app/settings.tsx`, `artifacts/soul-compass/profile/local.ts`, `artifacts/soul-compass/profile/storage.ts`, `artifacts/soul-compass/services/natal.ts`.
- API and request logging: `artifacts/api-server/src/routes/astrology.ts`, `artifacts/api-server/src/geocoding/geoapify.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/middlewares/security.ts`.
- License inventory: `artifacts/soul-compass/LICENSES_AND_DATA_SOURCES.md` (explicitly a scoped, not complete transitive, audit).
- Supabase isolation test: `supabase/tests/profile_rls.sql` (its header says it has not yet been run).

## Official references checked

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple enrollment: https://developer.apple.com/programs/enroll/
- Google Play personal-account testing: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- Google Play target API: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
- Google Play registration: https://support.google.com/googleplay/android-developer/answer/6112435?hl=en
- Google Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- Google Play account deletion: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
- GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
- EU Consumer Rights Directive: https://commission.europa.eu/law/law-topic/consumer-protection-law/consumer-contract-law/consumer-rights-directive_en
- Replit mobile publishing: https://docs.replit.com/build/mobile-app
- Replit private deployments: https://docs.replit.com/features/publishing/private-deployments
- Replit billing: https://docs.replit.com/billing/aug-cloud-billing-updates
- Expo store submission: https://docs.expo.dev/submit/introduction/
