# Architecture

- Expo Router owns the COSMOS/CRYSTALS UI and onboarding/settings.
- AsyncStorage stores birth date/time, mandatory `birthPlace`, and optional `currentResidence` separately.
- The Express API server owns astronomy calculations; no astronomical library is imported into the Expo bundle.
- `EphemerisProvider` isolates calculations from the route layer and permits a future provider replacement.
- The initial provider is Astronomy Engine. It runs offline and needs no calculation API key or downloaded data file.
- Public city lookup is user-initiated and sends only the typed city string. It is not used for birth data transmission.

Current data flow: API client -> POST `/api/astrology/positions` -> provider -> tropical zodiac placements. Natal charts, local-day transit events, generated interpretations, and crystal recommendations are not yet connected.
