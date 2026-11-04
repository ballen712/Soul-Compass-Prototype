---
name: Astrology profile rules
description: Confirmed Soul Compass requirements for home location and unknown birth times.
---

Use the user's declared home city as the default location for daily astrology. During onboarding, collect the home city and country and store its coordinates and IANA time zone in the profile. The user chose a public city lookup initiated by typing a city; do not use automatic GPS. Use the saved home location and time zone to determine the local date and time for daily readings. Do not change the home location when the user travels. Let the user update the home city manually in Settings.

Birth time is optional. Onboarding must include an explicit “I don't know my birth time” choice and permit continuing without a time. Store whether birth time is known instead of assigning an assumed time. Support timed and untimed charts throughout the astrology engine, horoscope generation, and crystal recommendations. For untimed charts, calculate and present only placements and transit relationships that remain reliable; do not claim accurate Ascendant, Midheaven, houses, or other time-sensitive interpretations. Explain the reduced precision, and let users add or correct their birth time later in profile settings.

**Why:** the user confirmed these product and architecture decisions.

**How to apply:** carry these constraints through onboarding, profile storage and editing, calculation inputs, reading language, and crystal recommendation rules. Test both known-time and unknown-time profiles, including readings that use the user's home time zone.
