# Soul Compass launch roadmap

**Owner goal:** prepare the app so iOS launch work can begin in about 2–4 weeks, without buying a developer membership during preparation.

## Platform recommendation

**Stage the launches: iOS first, Android later.** The current project is tested primarily on iPhone; Replit has a supported Expo Launch flow for iOS. Android is possible in the shared Expo codebase, but Replit does not currently submit to Google Play, Android app identifiers are incomplete, and newly created personal Play Console accounts have a mandatory 12-tester/14-day closed test before production access.

### Account model

Keep launch **accountless and local-first**. Nothing in the current core experience requires a user account. Local storage avoids a cloud profile database and account-recovery support; its tradeoff is that users cannot automatically synchronize across devices and may lose their profile if they clear app data or lose the device.

| Option | Product value | Added obligations and effort | Launch decision |
|---|---|---|---|
| Local profile only | Works without registration; birth details and preferences stay on the device except the consented chart request. | No cloud sync or automatic restore; a local delete/reset control exists, while export/import remains a future option. | **Use now.** |
| Optional cloud account/sync | Cross-device restore and synchronization. | Adds account data, secure ownership and RLS, sync/conflict behavior, user support and account deletion. Current account deletion path depends on an unconfigured server-only key. | Defer until users request sync. |
| Google Sign-In | Convenient OAuth for users who want cloud accounts. | Requires configured OAuth and account deletion. Apple Guideline 4.8 generally requires an equivalent privacy-preserving login option when a third-party sign-in is used for the primary account on iOS, unless an exception applies. | Not needed for the current app. |
| Sign in with Apple | Convenient native iOS login. | Requires Apple account setup and still creates account, deletion and privacy obligations; Android support needs an additional design. | Not needed without cloud accounts. |
| Email/password | Familiar sign-in method. | Requires secure password recovery, email delivery, abuse controls, account deletion and support. | Not needed for the current app. |

If cross-device protection becomes important, assess a user-controlled export/import before adding cloud sync. Do not add sign-in just because Android is planned.

| Route | Registration cost | Current project fit | Main release gates |
|---|---|---|---|
| iOS first | Apple membership is annual; standard US rate commonly listed as US$99/year. Confirm current Hungary/local-currency amount and eligibility on Apple enrollment before paying. | Best fit: iOS Bundle ID already exists; Replit Launch supports TestFlight/App Store Connect. | Public privacy policy; stable production API; signed build; metadata; TestFlight QA. |
| Android first | Google Play registration is US$25 once, subject to local charges. | Lower headline registration fee, but no Replit Play submission path. | Android package/version; verify target API 36 in `.aab`; Play signing; personal-account closed testing; external submission flow. |
| Both together | Both account fees and both release workflows. | Not recommended for first release. | Doubles listing, policy and device QA before product validation. |
| Temporary Expo Go | No store account fee. Existing hosting use can still be billable. | Useful for owner-owned iPhones/iPads while dev workflow is active. | Does not test a standalone production app; remote tester QR/auth flow has not been verified. |
| Public web deployment | No store account fee; existing deployment may incur usage. | Does not verify native iOS behavior. | Current Replit deployment is already marked public. Do not share it while privacy/restriction is unresolved. |

### Repository portability

No user-owned external GitHub remote was verified; the configured origin is a Replit-internal remote. Before developing outside Replit, create or connect a **private** source repository, review and commit the intended current project files, keep secrets out of Git, provision a replacement/managed PostgreSQL database, configure the production API host, and replace Replit-only domain/workflow settings. The code is based on Expo, React Native, Express and pnpm, so it is portable, but the current project is not a drop-in external deployment.

### Known operational charges

Replit's August 2026 billing documentation lists Autoscale as a monthly base fee plus compute and request usage. Its current documentation lists a US$2/month base, US$0.60 per million compute units and US$0.40 per million requests. Production PostgreSQL incurs compute/storage charges; scheduled backups are listed at US$0.09/GiB/month. Rates may change; the user's actual usage and bill were not queried. The currently active public deployment may continue accruing charges.

Geoapify use is documented in the project as its Free plan, with a published allowance recorded as 3,000 credits/day and up to five requests/second. Account-wide consumption and dashboard limits remain unverified. No paid service was purchased as part of this preparation.

## Phase 0 — restrict current public access

Replit's current private-deployment guide says a live app must first be unpublished, then its sharing option changed to Workspace only or Invite only, and then republished. This will interrupt the current public link. It may also make the published `/api` endpoint unreachable to an external mobile client.

The owner has selected “restrict access now,” but the live deployment service still reports the API as public. Its health endpoint returned 200 on 2026-11-06. The agent cannot change Publishing visibility from code. The owner must unpublish, choose Workspace only or Invite only, and republish in the Publishing tool. This interrupts the current public URL and blocks native clients that call it unless a separate public API design is in place.

Do not put a Replit external-access token in an Expo bundle. Anyone who extracts a mobile bundle can extract a bundled token. For public App Store users, decide between a carefully rate-limited public calculation API or a real authenticated gateway; keep the profile itself local and never send it to a new service without approval.

## Ordered preparation

| Step | Actions and expected result | Effort | Cost before Apple membership |
|---|---|---:|---|
| 1. Restrict the existing deployment | Unpublish; set Workspace only/Invite only; republish; test local Expo development separately. Avoid sharing its old URL. | 15–30 min of owner UI work | No new service fee; existing deployment usage may still apply. |
| 2. Confirm production API design | The production API hostname is available. On 2026-11-06, health and astrology health returned 200, a synthetic natal calculation returned 200, anonymous `/api/me/profile` returned 401, and an unapproved browser origin returned 403. A read-only database check found one prior-day HMAC source digest; cleanup runs on a later quota transaction, not a schedule. Astrology request limits are per-process; Geoapify quota counters are shared in PostgreSQL. City search was not called to avoid spending provider credits. Approve retention and global capacity controls before TestFlight. | 0.5–1 day | Existing Replit and Geoapify usage only; exact account costs unknown. |
| 3. Complete legal/privacy facts | Fill operator identity/address, purpose/legal bases, retention, provider role/DPA, transfers, age audience and user-rights process. Review with EU/Hungary counsel. | 1–3 days plus adviser time | Adviser fee unknown. |
| 4. Prepare app privacy controls | A confirmed local-profile reset is implemented in Settings → Privacy and its limits are documented. Add the final policy URL in the app only after operator details and policy review are complete. | 0.5–2 days | No new provider required. |
| 5. Complete release-quality checks | On 2026-11-06, all 142 local tests and 20 astrology tests passed after updating two stale copy assertions; API typecheck and 43 tests passed; Expo compatibility reported 20/20 checks. Finish seven-locale QA, native device checks, larger text, consent withdrawal, network failures and return-after-restart. | 2–5 days | No store fee. |
| 6. Prepare listing assets | Final descriptions, support/privacy pages, icon and iPhone screenshots; select category and answer rating/export questions. | 1–3 days | No store fee; design/legal assistance optional. |
| 7. Register Apple account when ready | Enroll with the correct personal/organization identity, complete verification and agreements. | Account-dependent | Annual Apple fee; verify current local price. |
| 8. Generate iOS TestFlight build | Use Replit Expo Launch, sign/upload the build, test on the owner's device and invited testers. | 1–2 weeks including feedback | Apple membership; Replit/Expo build charges depend on account plan and were not checked. |
| 9. Submit iOS release | Provide accurate privacy labels, screenshots, metadata and review notes; confirm the production API is available. | Several days plus Apple review | Existing hosting/DB usage continues. |
| 10. Add Android later | Set permanent package name/version, verify target API 36 in the generated build, create signed `.aab`, register Play Console, complete required closed test and store declarations. | At least 14 days for new personal-account testing, plus engineering/review time | US$25 one-time Play registration; external submission/build costs not verified. |

## App configuration notes

- The iOS bundle ID and iPhone-only flag are present. `ios.buildNumber` is set to `"1"` for the first native upload; increment it for each later upload.
- The app icon is a 1024×1024 opaque PNG with the requested starfield design.
- No explicit splash-screen asset/configuration was found; inspect the generated native launch screen before store screenshots.
- Android `package` and `versionCode` are not set in `app.json`.
- The artifact description now accurately describes the local-first app; it was updated through the supported artifact validation flow.
- A prior compatibility report records static iOS and Android bundle checks, not signed `.ipa`/`.aab` installation or store review.

## Pre-submission test journey

1. Fresh install and language choice without network or account.
2. Birth details, unknown birth time, date/time formatting and validation.
3. Explicit natal calculation consent, successful calculation, cached reopen, changed profile, withdrawal and offline failure.
4. Cosmos daily guidance and changed date/profile behavior.
5. Daily crystal, zero-to-three relevant recommendations, catalogue, collection and hidden stones.
6. City search, provider attribution, timeout/rate limit and network failure.
7. Settings, language change, local-data persistence and reset/deletion instructions.
8. iPhone compact screen, larger system text, app background/reopen, all seven supported languages.
9. Verify API URL and privacy disclosures in the signed production build, not Expo Go.

## Go/no-go now

**Go:** continue internal owner testing and finish drafts/checks that do not require a store account.
**No-go:** public sharing of the existing deployment, external friends beta via an unverified Expo Go QR, App Store submission, Google Play submission, paid Tarot or ads.
**Membership decision:** wait until policy, API access, build configuration, store materials and internal tests are ready. Then choose iOS first and pay for only the Apple program needed for TestFlight/App Store.
