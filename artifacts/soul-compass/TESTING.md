# Testing

Run:

- `pnpm --filter @workspace/api-server run typecheck`
- `pnpm --filter @workspace/api-server run test`
- `pnpm --filter @workspace/api-server run build`
- `pnpm --filter @workspace/soul-compass run typecheck`
- `pnpm --filter @workspace/soul-compass exec expo export --platform web`

The 14 API tests cover deterministic positions; angular/sign wrapping; historical Kyiv UTC conversion; DST folds/gaps and explicit occurrence choice; 23/25-hour days, skipped midnight/day; fractional offsets and invalid inputs; supplied Ascendant/MC regression; twelve ordered Placidus cusps; equatorial/northern/southern locations; polar refusal without fallback; unknown-time Moon uncertainty; exact cusp inclusion; applying/separating aspects including retrograde motion and orb limits; and four independent NASA/JPL position fixtures.

Reference comparison details and tolerances are in ASTROLOGY_ENGINE.md. Tests do not certify all house cusps against an independent engine, every historical zone, all epochs/planets, station behavior, or daily transit events. The tests use fixed independent reference fixtures, never live paid services or hardcoded production positions.

Executed for the natal milestone: API tests (14 passed), API typecheck/build, OpenAPI generation/shared library typecheck, Expo typecheck, and Expo Web export (10 static routes) all passed. A single browser pass at 402×874 verified known-time chart output, technical details, birthplace-only requests, unknown-time editing in Settings, Moon uncertainty on June 21, reload persistence, and COSMOS/CRYSTALS navigation. No chart/API errors were observed. Native-device rendering was not part of that browser pass.
