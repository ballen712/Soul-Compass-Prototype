# Testing

## Current local-first verification

The product-readiness pass adds city-search race/data validation, local-clock/foreground refresh, minute-cache/midnight and intention/hidden-stone recommendation regressions. Current suite: 40 Vitest client cases, 10 Node daily-astrology cases and 25 API cases. Expo Doctor now passes 20/20 following normal SDK-compatible alignment after the package-release-age window elapsed. See LAUNCH_READINESS.html for current production-build/browser evidence and remaining device gates; the historical milestone counts below are not current totals.

Run `pnpm --filter @workspace/soul-compass test` for the Vitest suite and astronomy regressions. Use `pnpm --filter @workspace/soul-compass test:local` to run Vitest alone. Coverage includes validated profile creation and edits, known and unknown birth-time onboarding, selected city coordinates and time-zone persistence after reload, Settings edits that preserve unrelated profile values, invalid dates and unselected city edits, legacy migrations, corrupt/future-schema preservation, failed writes, serialized independent updates, collection changes, consent grant/revoke/versioning, in-flight cancellation, payload minimization, request deduplication, and no automatic retries or sends. Storage and HTTP are explicit test doubles, not actual native-device persistence.

The separate astronomy regression suite can be run with `pnpm --filter @workspace/soul-compass test:astrology`.

Backend tests now include protected cloud-route contracts and security alongside the 14 astronomy regressions described below; those endpoints remain protected although the client no longer calls them.

Run `CI=1 pnpm --filter @workspace/soul-compass exec expo install --check` and `pnpm dlx expo-doctor@latest` from the app directory. Do not bypass the workspace's minimum package release age if recommended versions are not yet installable.

Use `EXPO_BUILD_METRO_PORT=20060 pnpm --filter @workspace/soul-compass run build` to test the native static bundle pipeline against the managed Metro server. This is a JS bundle/manifest build, not a signed iOS/Android binary or an App Store submission. Never claim physical iPhone verification from web tests.

All routes are eagerly included (`asyncRoutes: false`) so opening local settings offline after loading the app does not fetch an unvisited route chunk. A fresh browser page load without internet still requires the app assets to be cached; no service-worker/PWA offline shell is implemented.

The following sections document historical natal-milestone coverage, not the latest overall test totals.

Run:

- `pnpm --filter @workspace/api-server run typecheck`
- `pnpm --filter @workspace/api-server run test`
- `pnpm --filter @workspace/api-server run build`
- `pnpm --filter @workspace/soul-compass run typecheck`
- `pnpm --filter @workspace/soul-compass exec expo export --platform web`

The 14 API tests cover deterministic positions; angular/sign wrapping; historical Kyiv UTC conversion; DST folds/gaps and explicit occurrence choice; 23/25-hour days, skipped midnight/day; fractional offsets and invalid inputs; supplied Ascendant/MC regression; twelve ordered Placidus cusps; equatorial/northern/southern locations; polar refusal without fallback; unknown-time Moon uncertainty; exact cusp inclusion; applying/separating aspects including retrograde motion and orb limits; and four independent NASA/JPL position fixtures.

Reference comparison details and tolerances are in ASTROLOGY_ENGINE.md. Tests do not certify all house cusps against an independent engine, every historical zone, all epochs/planets, station behavior, or daily transit events. The tests use fixed independent reference fixtures, never live paid services or hardcoded production positions.

Executed for the natal milestone: API tests (14 passed), API typecheck/build, OpenAPI generation/shared library typecheck, Expo typecheck, and Expo Web export (10 static routes) all passed. A single browser pass at 402×874 verified known-time chart output, technical details, birthplace-only requests, unknown-time editing in Settings, Moon uncertainty on June 21, reload persistence, and COSMOS/CRYSTALS navigation. No chart/API errors were observed. Native-device rendering was not part of that browser pass.
