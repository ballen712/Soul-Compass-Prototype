---
name: City-provider budget and scope
description: Owner-approved Geoapify Free plan and why the previous provider was replaced.
---

The user approved replacing city search with Geoapify and confirmed its Free plan. Do not subscribe, upgrade, spend money or expose a geocoding key to Expo.

**Why:** Open-Meteo's free commercial restriction blocked the intended commercial beta; the user explicitly requested a server-only replacement without paid services or unrelated changes.

**How to apply:** preserve saved location formats and birthplace/residence separation, send only explicit search queries, and review the provider's current commercial/attribution/quota terms before release. Account-wide usage and dashboard restrictions cannot be inferred from a successful API response; disclose what remains unverified. Do not treat process-local counters as a durable or multi-instance billing cap.

Keep required Geoapify and OpenStreetMap credits visible beside each city search, but visually quiet. Put the longer explanation of query handling and provider privacy in Settings → About.

**Why:** the user wants to reduce clutter in first-run onboarding without dropping required attribution.

**How to apply:** retain short, readable linked credits next to the picker; do not hide them solely in About.

The server now targets Geoapify's `api-eu.geoapify.com` endpoint, which Geoapify's public DPA identifies as strictly EU-bound. This does not establish that the user's account has accepted or is covered by that DPA.

**Why:** the user asked to apply read-only audit fixes, and the public DPA distinguishes the EU endpoint from the global endpoint's listed US network provider.

**How to apply:** preserve the EU endpoint unless the owner changes the data-region decision. Verify account-specific key support and DPA applicability before making broader legal claims about processing location.
