---
name: Astrology profile rules
description: Confirmed Soul Compass requirements for home location and unknown birth times.
---

Collect a mandatory birthplace and store its city, country, coordinates, and IANA time zone separately from an optional current residence. Use birthplace for natal-chart inputs only; use current residence for local dates and location-dependent daily readings, never as a birthplace substitute. Do not infer or collect GPS location; the user chose a public city lookup initiated by typing a city, and only that city name is sent to the provider. Keep both locations independently editable. The current Open-Meteo free geocoding endpoint is limited to non-commercial use and has daily/hourly/minute request caps; retain GeoNames/Open-Meteo attribution and CC BY 4.0 notice. A commercial app must use an appropriately licensed provider plan.

Birth time is optional. Onboarding must include an explicit “I don't know my birth time” choice and permit continuing without a time. Store whether birth time is known instead of assigning an assumed time. Support timed and untimed charts throughout the astrology engine, horoscope generation, and crystal recommendations. For untimed charts, calculate and present only placements and transit relationships that remain reliable; do not claim accurate Ascendant, Midheaven, houses, or other time-sensitive interpretations. Explain the reduced precision, and let users add or correct their birth time later in profile settings.

**Why:** the user confirmed these product and architecture decisions.

**How to apply:** carry these constraints through onboarding, profile storage and editing, calculation inputs, reading language, and crystal recommendation rules. Test both known-time and unknown-time profiles, ensuring natal inputs use birthplace and local reading dates use current residence only.

An initial server-side position-calculation foundation uses MIT-licensed Astronomy Engine to stay in the existing TypeScript API and avoid a separate Python service. It uses bundled formulas/coefficients, not a JPL DE dataset, and has not been independently accuracy-validated.

**Why:** the project brief prioritizes a maintainable, permissively licensed engine, but explicitly requires verified ephemeris sources and tests before calculated readings are presented as accurate.

**How to apply:** treat this provider as an initial calculation slice only. Do not claim DE440/DE441 coverage or personalized natal/transit accuracy; validate a JPL-backed alternative and complete time-zone, house, event, and regression testing before replacing sample reading content.
