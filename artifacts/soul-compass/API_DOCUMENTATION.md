# Astrology API

Base path: `/api`.

## `GET /astrology/health`

Returns provider identifier/version and whether position calculations are available.

## `POST /astrology/positions`

Request:

```json
{ "atUtc": "2000-01-01T12:00:00.000Z" }
```

The timestamp must be ISO 8601 UTC with a trailing `Z`. The response contains provider and coordinate metadata and ten planetary positions, each with longitude, latitude, tropical sign, degree in sign, speed, retrograde flag, and UTC timestamp. This endpoint accepts no profile or birthplace data.

The OpenAPI source is `lib/api-spec/openapi.yaml`.

## `POST /astrology/natal-chart`

```json
{
  "birthDate": "1991-06-20",
  "birthTime": { "status": "known", "localTime": "19:51" },
  "birthPlace": { "latitude": 48.50834, "longitude": 32.26618, "timeZone": "Europe/Kyiv" },
  "houseSystem": "placidus",
  "zodiac": "tropical",
  "orbs": { "luminary": 8, "other": 6 }
}
```

Use `{"status":"unknown"}` instead of a known birth time when unavailable. A repeated local time returns 422 unless `birthTime.disambiguation` is explicitly `earlier` or `later`; a skipped local time returns 422. No offset is guessed. Invalid shapes, zodiac or unsupported house systems return 400. Invalid dates, zones, coordinates or calculations return 422 with an explanatory `error`.

Returns `planets` (ten positions), nullable `angles`, `houseCusps`, `planetaryHouses`, `aspects`, `moonSignRange`, `warnings`, an `input.birthTimeKnown` summary, and calculation metadata (UTC reference/actual instant, precision convention, provider version, host time-zone database, angle convention and house availability). Raw profile data is not echoed. Placidus failure returns partial planetary/angle results and warnings, never a silent fallback.

## Public calculation API protections

The API is stateless and unauthenticated: it computes only from the submitting client's request and exposes no stored-profile CRUD. It is not an account system. Responses use `Cache-Control: no-store`; do not cache birth-specific results at a CDN or proxy.

Requests must be uncompressed JSON, at most 16 KiB. Malformed JSON returns a sanitized 400; oversized/compressed/wrong-content-type requests return 413/415. Calculation POSTs are limited to 120 per minute per socket peer, per API process. Behind a reverse proxy this is deliberately a shared limit; spoofed forwarded IPs are not trusted. A 429 response includes Retry-After. This is basic protection, not distributed DDoS protection.

Browser origins must exactly match `CORS_ALLOWED_ORIGINS` (comma-separated HTTP(S) origins) or the deployment's supplied Replit/Expo host origins. No wildcard or credentialed CORS is enabled. Verify the production browser origin before publishing; custom hosts must be explicitly configured. Native requests without Origin remain permitted: CORS is not authentication.

## Private cloud account API (configuration required)

All `/api/me/*` operations require `Authorization: Bearer <Supabase access token>`; the API verifies the identity with Supabase Auth. Profile operations execute using that same user JWT and RLS. Administrative credentials are used only for explicit account deletion, never ordinary profile reads/writes. Responses are `no-store`; failures never echo profile contents or provider error details.

| Method/path | Behavior |
|---|---|
| GET `/api/me/profile` | Returns `{record:null}` or `{record:{profile,preferences,version}}` for the authenticated user only |
| POST `/api/me/profile` | Strict `{profile,preferences}`; creates one own record (201), or 409 if one already exists |
| PUT `/api/me/profile` | Strict `{profile,preferences,expectedVersion}`; updates only own matching version, otherwise 409 |
| DELETE `/api/me/profile` | Deletes own profile only (204); does not delete the Auth identity |
| DELETE `/api/me/account` | JSON `{confirmation:"DELETE"}` and sign-in within 15 minutes required; deletes verified Auth identity and cascaded profile (204) |

Missing/invalid credentials: 401. Recent sign-in needed: 403. Validation: 400. Provider/configuration unavailable: 503. Private operations share the bounded per-peer process limiter (429); PUT is JSON-only and CORS methods include PUT/DELETE. No client-provided user ID is used for ownership.

Profile data and preferences follow `lib/api-zod/src/profile.ts`; ownership/version/timestamps cannot be supplied in profile create/update bodies. See `PHASE3_IMPLEMENTATION.md` and `PHASE3_SETUP.md`. Live RLS/provider flows remain unverified until setup.
