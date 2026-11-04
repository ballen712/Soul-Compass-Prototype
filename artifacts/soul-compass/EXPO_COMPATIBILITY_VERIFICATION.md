# Expo SDK 58 compatibility verification

Verified on 2026-11-04 against the current checkout.

The earlier release-age blocker described in `LOCAL_FIRST_IMPLEMENTATION.html`
is resolved in this checkout. The dependency manifest and lockfile were already
aligned when this verification began. The standard fix command completed
normally without changing either file; no additional dependency update was
necessary.

## Results

| Check | Command | Result |
| --- | --- | --- |
| Standard SDK alignment | `pnpm --filter @workspace/soul-compass exec expo install --fix` | Dependencies are up to date; exit 0 |
| Dependency compatibility | `pnpm --filter @workspace/soul-compass exec expo install --check` | Dependencies are up to date; exit 0 |
| Expo Doctor | From `artifacts/soul-compass`: `pnpm dlx expo-doctor@latest` | 20/20 checks passed |
| Workspace TypeScript | `pnpm run typecheck` | Passed shared libraries and all configured artifact/script typechecks |
| Client tests | `pnpm --filter @workspace/soul-compass test` | 45 Vitest cases and 10 Node astrology cases passed |
| API tests | `pnpm --filter @workspace/api-server test` | 25 passed, including protected profiles, privacy, CORS and rate limiting |
| API build | `pnpm --filter @workspace/api-server run build` | Passed |
| Web production export | `pnpm --filter @workspace/soul-compass exec expo export --platform web` | Passed; 10 static routes |
| Native static build | `EXPO_BUILD_METRO_PORT=20060 pnpm --filter @workspace/soul-compass run build` | iOS/Android bundles and manifests passed; 55 assets copied |
| Dependency audit | Project dependency scanner | Zero vulnerabilities at every severity |
| Static analysis | Project static scanner | Complete scan; zero findings |
| Privacy/data-flow analysis | Project privacy scanner | Zero findings |

The managed Expo workflow was restarted and served onboarding successfully.
The API workflow was initially stopped and was started for preview connectivity.
Its health endpoint then returned HTTP 200, and the positions endpoint's CORS
preflight returned HTTP 204 with the exact Expo preview origin allowed.
Generated bundles remain in ignored output directories, not source control.

## Safety and scope

- Expo remains on SDK 58 (`~58.0.23`); no major SDK upgrade.
- The existing `minimumReleaseAge: 1440`, exclusions, overrides and checks were
  left unchanged. No new exception, suppression or alternate registry was used.
- No application, local storage, consent, backend security or Supabase source
  was changed. No secrets, cloud records, migrations or provider settings were
  read or modified.
- Existing local persistence and consent regression suites passed. This pass
  did not repeat the earlier interactive browser journeys, because no runtime
  behavior or dependency resolution changed.
- Static native bundles are not signed binaries or proof of physical-device
  behavior. Real-iPhone verification remains separate.
- Nothing was published. Clean scans are not a security certification.

The historical local-first report remains evidence of its original milestone;
this document supersedes only its outstanding Expo compatibility status.
