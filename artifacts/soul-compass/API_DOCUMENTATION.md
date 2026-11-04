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
