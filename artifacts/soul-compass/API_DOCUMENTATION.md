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

Returns `planets` (ten positions), nullable `angles`, `houseCusps`, `planetaryHouses`, `aspects`, `moonSignRange`, `warnings`, original input, and calculation metadata (UTC reference/actual instant, precision convention, provider version, host time-zone database, angle convention and house availability). Placidus failure returns partial planetary/angle results and warnings, never a silent fallback.
