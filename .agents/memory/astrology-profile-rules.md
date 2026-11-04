---
name: Astrology profile rules
description: Confirmed Soul Compass requirements for home location and unknown birth times.
---

Collect a mandatory birthplace and store its city, country, coordinates, and IANA time zone separately from an optional current residence. Use birthplace for natal-chart inputs only; use current residence for local dates and location-dependent daily readings, never as a birthplace substitute. Do not infer or collect GPS location; the user chose a public city lookup initiated by typing a city, and only that city name is sent to the provider. Keep both locations independently editable. The current Open-Meteo free geocoding endpoint is limited to non-commercial use and has daily/hourly/minute request caps; retain GeoNames/Open-Meteo attribution and CC BY 4.0 notice. A commercial app must use an appropriately licensed provider plan.

Birth time is optional. Onboarding must include an explicit “I don't know my birth time” choice and permit continuing without a time. Store whether birth time is known instead of assigning an assumed time. Support timed and untimed charts throughout the astrology engine, horoscope generation, and crystal recommendations. For untimed charts, calculate and present only placements and transit relationships that remain reliable; do not claim accurate Ascendant, Midheaven, houses, or other time-sensitive interpretations. Explain the reduced precision, and let users add or correct their birth time later in profile settings.

**Why:** the user confirmed these product and architecture decisions.

**How to apply:** carry these constraints through onboarding, profile storage and editing, calculation inputs, reading language, and crystal recommendation rules. Test both known-time and unknown-time profiles, ensuring natal inputs use birthplace and local reading dates use current residence only.

Retain MIT-licensed Astronomy Engine behind the existing provider boundary unless there is a compelling technical reason to replace it. Do not add Swiss Ephemeris, GPL/AGPL dependencies, paid APIs/datasets, or commercial ephemeris licensing. A limited independent comparison is not permission to claim universal precision or JPL DE-file usage.

**Why:** the user explicitly required this in the natal-engine phase, preserving the existing TypeScript architecture rather than replacing the provider.

**How to apply:** keep astronomical calculations server-side and distinguish calculated natal data from sample daily readings. Extend independent reference coverage as needed instead of silently swapping providers.

Default houses must be Placidus; if unsuitable, warn without silently substituting a system. Unknown-time natal charts may use a documented local-noon reference but must omit angles/houses and explain Moon uncertainty. Repeated birth wall-clock times require an explicit occurrence choice, not an assumed offset.

**Why:** the user requires honest precision and no fabricated birth moment or hidden house-system fallback.

**How to apply:** retain these distinctions in future calculation APIs, chart displays and interpretations; never treat reference-noon placements as a known birth instant.
