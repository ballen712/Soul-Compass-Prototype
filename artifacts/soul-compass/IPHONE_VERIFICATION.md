# Physical iPhone privacy and offline verification

## Status

Updated 2026-11-05. **Physical checks recorded with remaining safety-limited
items listed below; no further real-profile chart request will be made.**
The user reports that Expo Go now opens Soul Compass on an iPhone 15 Pro,
iOS 27.2, Expo Go 58.0.5.
An uploaded screenshot shows Expo Go's message: “A server with the specified
hostname could not be found.” The screenshot does not include the hostname
that was attempted. Device/software versions are user-reported, not
independently inspected. Browser tests and static native bundles are not
device evidence. This check remains incomplete until the device results below
are recorded.

The latest workflow log shows a successful iOS JavaScript bundle build (2146
modules), but that does not establish successful device launch. The tunnel
address changed after the initial handoff. Its current HTTPS `/status` returns
`packager-status:running` from the development environment. The user retried
the latest link and reports another error. From this environment, the current
public hostname resolves to Cloudflare IPv4 addresses and HTTPS `/status`
returns HTTP 200. The user opened the HTTPS `/status` URL in iPhone Safari and
reports it shows `packager-status:running`. The iPhone's DNS/network can reach
Metro over HTTPS; opening the app in Expo Go remains unresolved. The user
reports the Expo Go screen has no QR scan option. Replit's documented flow is
Project Editor → Preview → Open in Expo Go, then scan that current QR using
the iPhone camera. No Expo account is required unless Expo Go explicitly
presents a sign-in flow; if it does, use only Replit's managed preview
instructions rather than creating or manually signing in to an Expo account.

The user reports that scanning the QR presents Replit's eight-character
connection-code prompt, which they complete before the hostname error. Replit
documentation confirms this is expected for its managed phone-preview flow.
During this check the Expo tunnel hostname rotated:
`c-replitprivate18553180b3aa482fb49e30d7-510nx1-mw2gaoym9w5rbi6w.on.expo.app`
returned HTTP 502, while the newer
`c-replitprivate18553180b3aa482fb49e30d7-510nx1-mw2hhhitrhc2ss1u.on.expo.app`
resolved and returned HTTP 200, with SDK 58.0.0 and a launch-asset URL in its
iOS manifest. The user retried a refreshed QR after this rotation and reports
the same hostname error. They also opened the exact latest HTTPS `/status`
address in iPhone Safari and confirmed `packager-status:running`. The live host
serves the iOS JavaScript bundle (HTTP 200, 12,099,899 bytes) from this
environment. This rules out general iPhone DNS/network failure for that host,
but does not demonstrate device-side bundle access or explain the Expo Go-only
failure. No natal chart request appears in the API workflow logs during the
failed launch attempts.

The user later reported “it works now” and confirmed an existing profile screen
is visible on their iPhone 15 Pro (iOS 27.2, Expo Go 58.0.5; user-reported).
They said the profile contains real data and initially chose read-only device
testing. The code advanced consent terms to v3; the previous v2 grant no longer
authorizes requests under the changed cached-chart behavior. During the updated
phone check, the user confirmed pressing “Agree and calculate” and later said
the Natal Chart appeared. The API log recorded one
`/api/astrology/natal-chart` POST with HTTP 200 at 2026-11-04 22:04:41
Europe/Budapest. This may correspond to the user's action and may have sent
real birth details to the development calculation endpoint, but logs contain
no payload or device identity, so attribution and inputs cannot be proven. The
endpoint returns the result and does not persist profile data. The user later
confirmed the Privacy status reads “Withdrawn.” Do not repeat a real-profile
request. Personal birth values must not be reproduced in reports, logs or chat.
The user previously reported an offline chart-fetch error and confirmed tapping
Calculate Chart. Three successful natal-chart POSTs are present in the API logs
at 19:22:17, 19:31:07 and 19:36:52 (HTTP 200). The logs contain no request body
or device identity, so they cannot establish attribution or which birth inputs
were used. Treat transmission of real birth inputs as possible; the calculation
route returns a chart and does not persist profile data. No profile values were
shared with the assistant, and no profile was edited by the assistant.
After the previous UX pass, the user confirmed the app opens and reported that
Settings buttons, Preferences, Privacy and About look good. In a later iPhone
check, they said Crystals looks good, Cosmos feels too short and cut off, and
Natal still showed “Your chart will refresh automatically” without displaying a
chart after Agree. They did not provide the action time, so the API logs cannot
be reliably matched to that attempt. The latest fixes still need device
confirmation.

The updated Expo workflow serves a public tunnel with a running packager. On
the iPhone, the user reports that all Cosmos explanation dialogs opened, both
Settings and Collection opened with Wi-Fi and cellular disabled, the Natal
Chart appeared after consent, and the app returned to the same screen after
backgrounding. They also report that keyboard controls on Natal Chart are now
visible. The “Not now” choice, timed/untimed chart display and in-flight
withdrawal race were not tested. The user has no second device, and the real
profile must not be used for further chart tests. The mobile browser preview
renders onboarding without browser errors; it has no profile saved, so it does
not show the Cosmos or Natal screens.

## Software verification evidence

- Existing SDK compatibility report: `EXPO_COMPATIBILITY_VERIFICATION.md`.
- Fresh `CI=1 pnpm --filter @workspace/soul-compass exec expo install --check`:
  dependencies up to date, exit 0.
- Managed mobile service uses the existing `dev` command and public Expo tunnel.
- Current Soul Compass typecheck passed; 64 Vitest tests and 10 Node astrology
  tests passed. API typecheck and 43 API tests passed in the prior API
  verification; API code was not changed in this task.
- A fresh Expo export for iOS, Android and web succeeded. The iOS and Android
  JavaScript bundles were each about 5.7 MB, and ten static routes were emitted.
  This validates bundling, not signed release binaries.
- Dependency audit: zero findings. SAST: zero findings. HoundDog privacy scan:
  zero findings.
- A synthetic unknown-time POST to the development Natal endpoint returned
  HTTP 200 with ten planets and no angles. This was an agent smoke test, not an
  iPhone request or real-profile test.
- Focused synthetic consent regression tests exercise the actual “Not now”
  prompt action, a pending request withdrawn before its late response, cache
  preservation, app restart after refusal, and app resume after an offline failure. The generated API
  client is mocked in these tests, so no network request is sent. Assertions
  inspect call counts, abort status and synthetic local-cache values; they do
  not print request bodies or profile values. The race test caught and fixed a
  cancellation timing issue that could clear an already displayed chart.
  Physical-device behavior remains unverified.
- Focused consent verification: 18 tests passed. The full package run had 96
  passing tests and one unrelated failure in `tests/crystals-screen.test.tsx`
  (`suggestion.crystal` was undefined). The current package typecheck also
  reports six errors in the untouched Crystals screen and crystal-guidance
  files; none are in the files changed for consent verification.
- The freshly restarted Expo tunnel returned `packager-status:running`. After
  the user's withdrawal confirmation, the API workflow was restarted on
  2026-11-05; its fresh log showed only health-check GETs through 08:46 and no
  natal-chart POST. This is not a device-specific network trace.
- The
  current mobile browser preview rendered onboarding without a browser error;
  this is not a signed-in or physical-device screen.
  Earlier native launch and Expo compatibility evidence remains in the history
  above and `EXPO_COMPATIBILITY_VERIFICATION.md`.
- After the device reported that Agree did not produce a chart, the shared
  app-session refresh trigger and visible calculation status were strengthened.
  Automated integration tests confirm a rendered timed chart after Agree; the
  user now reports that the chart appeared on the iPhone. No second request was
  made after the user confirmed withdrawing permission.

## Safety and evidence protocol

This task permits synthetic test data only. Do not edit the user's saved
real-profile data or initiate another chart request from that profile. The
user confirmed they withdrew permission in Settings; the saved chart remains
local. Matching results are cached so ordinary launches do not resend
unchanged birth details. Requests require current consent, are not queued
offline, and are not sent merely because connectivity returns. Do not introduce
registration, cloud profile synchronization, analytics, paid services or
production changes. Do not ask the user to send profile values in chat. No
profile values were edited by the assistant.
Preserve sample labels and distinguish sample content from personalized output.

Record model, iOS and Expo Go version, test time with timezone, and each actual
outcome. Screenshots must contain synthetic details only. Correlate the device
actions with the existing API method/path/status logs; do not enable body,
token or personal-data logging. A device screenshot alone cannot prove no
network request occurred. Unrelated traffic or an unobservably fast calculation
must be recorded as inconclusive, not passed.

## Device checks and observations

| Check | Procedure and required evidence | Result |
| --- | --- | --- |
| Native launch | Open the current public tunnel in Expo Go and record versions/errors. | User reports the app opens on iPhone 15 Pro / iOS 27.2 / Expo Go 58.0.5. The updated Cosmos details and Natal Chart opened; Settings, Preferences, Privacy and About were previously reported as working. |
| Phone DNS distinction | Open current HTTPS `/status` in iPhone Safari. | Earlier tunnel returned `packager-status:running` in Safari; the user reports the app now opens. |
| Manual consent and calculation | With consent off, verify no request before Agree; tap Agree and check loading/result/error. | User confirms tapping “Agree and calculate” and later reports the chart appeared. One HTTP 200 POST at 22:04:41 may correspond; source and payload are unknown. The profile is real, so the request may have transmitted its birth details to the development endpoint. Permission is now withdrawn; do not repeat. Synthetic integration tests cover request, timeout, result and error paths. A separate synthetic integration test taps “Not now” and confirms no request before or after app restart and resume. |
| Persistent consent and app launch | Agree once, force-close and relaunch; confirm one request starts without another prompt or Calculate button. | Automated tests cover cache-first loading, updated-consent gating and avoiding duplicate requests for a matching chart. The user confirmed permission status “Withdrawn”; no physical relaunch test after consent was granted. |
| Cosmos and Crystals copy | Check the reflection heading/message/moment and the stone's symbolic day relevance. | User reports all Cosmos explanations opened on the phone; Crystals was previously reported as good. The latest Crystals copy was not separately confirmed. |
| Known time | Inspect a known-time chart, angles/houses and optional details. | Synthetic screen tests verify a timed chart displays supported Ascendant/Midheaven, Placidus house cusps and planetary houses. A polar-location response retains supported angles while omitting unavailable houses, and a separate response omits unavailable angles. Tests use only an isolated Example profile (2000-01-01, 12:00, UTC); no saved phone profile was read or edited. Physical display remains unverified because the available phone profile is real and there is no second device. |
| Unknown time | Use unknown-time mode; confirm no angles/houses are presented as known. | Synthetic screen test verifies the local-noon reference is identified, angles and houses are omitted even if unexpected timed fields appear in the response, the Moon range remains visible, and the chart is marked “PERSONAL NATAL CHART,” not sample content. It uses only the isolated Example profile with unknown time; no saved phone profile was read or edited. Physical display remains unverified for the same safety reason. |
| Withdrawal during calculation | Start an explicit request, then withdraw permission while pending; check that no late result appears. | Synthetic hook test starts a second pending calculation while a prior chart is cached, withdraws permission, then resolves a late synthetic response. The late result is discarded and both visible chart state and local cache remain unchanged. Physical race was not tested; the user's real profile must not be used. |
| No reconnect sends | Reconnect after an offline launch and check that no natal request starts while idle or after resume. | Synthetic integration test starts with current consent, simulates an offline request failure, restores the mocked transport, and resumes the app; the request count remains one. The app has no connectivity-triggered retry. Physical reconnection was not tested; earlier server logs cannot correlate a network transition to this phone. |
| Offline settings and collection | Open Settings sections and Collection offline; verify local content and navigation. | User confirms both opened with Wi-Fi and cellular disabled on the updated app. |
| Keyboard and safe areas | Edit profile fields with keyboard open; verify lower inputs and save/back controls remain reachable. | User clarified that the affected screen was Natal Chart and reports its controls are now visible. |
| Lifecycle and local preferences | Background/foreground and reopen without clearing data; confirm no automatic chart request. | User confirms the same screen returned after background/foreground. Non-privacy preference persistence was not tested because the device profile was kept read-only. |
| Scope labels | Confirm sample/symbolic notices and no registration prompt. | Sample labels are preserved in code; the user did not report a registration prompt. Latest Crystals copy was not separately confirmed. |

## Remaining limitations

- The manual “Not now” choice, timed/untimed chart precision, in-flight
  revocation race, reconnect behavior and non-privacy preference persistence
  were not physically verified. Automated privacy checks use only synthetic
  data and a mocked API boundary. Only the user's real profile is available,
  so further chart tests must use a separate synthetic profile/device.
- The user confirmed the Natal Chart keyboard now leaves controls visible.
- Offline use of an already-loaded Expo Go bundle is distinct from a cold
  offline launch; Expo Go may require Metro to reload. Record that separately
  rather than treating it as proof about an installed release binary.
- Physical cancellation-race coverage requires a visibly pending request. If
  normal latency is too short, retain the passing automated abort/discard test
  and record the physical gap; do not add a production delay.
- No signed release binary, App Store behavior or Android device behavior is
  established here. Nothing was published.

## UX follow-up

On 2026-11-05, Cosmos received a new local hero image and a centered explanation
modal; Natal Chart received centered placement explanations and clearer reading
guidance. These changes do not alter birth-data requests, chart caching, consent,
or offline behavior. Automated tests use synthetic chart data. The signed-in
Cosmos and Natal screens have not been rechecked on the physical iPhone after
these UI changes; the browser preview only showed the empty onboarding state.
