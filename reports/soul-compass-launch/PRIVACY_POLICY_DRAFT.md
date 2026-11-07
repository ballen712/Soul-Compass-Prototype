# Soul Compass Privacy Policy — DRAFT

> **Not for publication.** This is a working draft based on code and deployment checks reviewed on 7 November 2026. It contains unresolved facts and legal decisions. Do not add it to App Store Connect, Google Play, a public website or the app until every bracketed item is resolved and the policy has been reviewed for the operator's actual circumstances.

**Last updated:** [PUBLICATION DATE]
**Effective date:** [EFFECTIVE DATE]
**Controller / operator:** Vadim Shelokhanov (individual)
**Country:** Hungary
**Postal/contact address:** Budapest, Gombocz Zoltan, 1118 — completeness and postal deliverability must be confirmed before publication.
**Privacy contact:** Soul Compass Support <soulcompass.support@gmail.com>
**Policy URL:** [STABLE PUBLIC HTTPS URL]

## 1. About this policy

This policy explains how the current version of Soul Compass handles information when you use the app. Soul Compass is a registration-free, local-first app for daily reflections, crystal guidance and optional natal-chart calculations.

The app does not ask you to create an account and does not currently provide cloud profile synchronization. The app's active mobile interface does not send your collection, daily feeling, language, name or current residence as part of a natal-chart calculation.

## 2. Information kept on your device

The app stores your birth profile, selected residence, language, preferences, daily feeling, crystal collection, hidden stones and privacy-consent status on your device using the app's local storage.

This local storage is not encrypted by Soul Compass at the application layer. Your device's backup may include app data. To erase the local profile, open **Settings → Privacy → Delete local profile** and confirm. This removes the saved profile, birth details, residence, language, preferences, crystal collection, chart consent and cached chart from this device, then returns the app to setup. You must select a language and enter your details again to continue. This action does not erase device backups or technical records created by network features. The current app does not provide a full profile export or import feature.

## 3. Optional natal-chart calculation

If you give permission for a natal-chart calculation, the app sends your birth date, whether your birth time is known (and the time you entered, if known), and your birthplace coordinates and time zone to the Soul Compass server to calculate the chart.

Your name, current residence, language, daily feeling and crystal collection are not included in this request. The app saves the chart on your device. It does not queue a failed request for later. You can withdraw permission in Settings; withdrawal blocks future requests and cancels or discards an active result when possible, but cannot undo a request that has already been sent.

The production calculation endpoint was checked with fabricated birth details and returned a chart response. The inspected application route does not write the request or chart to its application database. Replit hosting, networking and security-log retention have not been verified; this test does not establish that infrastructure keeps no request metadata.

## 4. City search

When you tap Search, the city name you enter is sent to the Soul Compass server and forwarded to Geoapify with fixed search parameters so the app can show matching cities, coordinates and time zones. The app does not send device GPS or the saved birth profile for this search. The server does not forward your device IP address or request headers to Geoapify; Geoapify receives normal server connection metadata.

**Provider details to complete:** [IDENTIFY GEOAPIFY'S ROLE, RELEVANT PROCESSING TERMS/DPA, DATA LOCATION, LOG RETENTION AND ANY INTERNATIONAL TRANSFERS AFTER VERIFICATION.]

## 5. Operational and technical information

The Soul Compass API processes network requests. Its application request logger records request method, path without query parameters and response status; the inspected logger does not record request bodies. Astrology calculation requests are subject to a shared, one-minute aggregate limit. PostgreSQL stores only the total count and limit for the current minute, without a user, device, or IP identifier. The separate local peer limiter applies to protected legacy account routes. Replit may observe or retain ordinary connection metadata.

City-search quota controls also store an operational counter and a keyed daily HMAC digest of the server-observed connection peer in PostgreSQL. The quota database does not store the raw city query or raw peer address; the peer may be a proxy rather than the end user's device. Previous-day digests are deleted when a later quota transaction runs after UTC midnight. Cleanup is request-triggered, not scheduled, so a digest may remain longer if no later request occurs. The aggregate astrology count resets when a calculation arrives in a later minute window and may remain unchanged while idle. [CONFIRM DATABASE BACKUP RETENTION AND SET AN APPROVED MAXIMUM RETENTION PERIOD BEFORE PUBLICATION.]

Replit hosts the app/API and operational database. Its infrastructure may process connection and service metadata. [DESCRIBE THE ACTUAL REPLIT DATA REGION, LOGGING, RETENTION, SUBPROCESSORS AND CONTRACTUAL TERMS AFTER VERIFICATION.]

The current app code inspected does not include advertising, analytics, cross-app tracking, an active AI service or a user-account system. [RECHECK THE FINAL DEPENDENCY LIST, IOS PRIVACY MANIFESTS AND GOOGLE PLAY SDK DECLARATIONS BEFORE EACH RELEASE.]

## 6. Why information is processed

The app uses on-device information to provide the features you choose. A city search uses the city text you submit to provide search results. An optional natal calculation uses the birth details described above after you give permission.

**Legal bases:** [A QUALIFIED ADVISER MUST CONFIRM AND DOCUMENT THE GDPR LEGAL BASIS FOR EACH PURPOSE, INCLUDING OPTIONAL CHART REQUESTS AND CITY SEARCH. Do not publish this placeholder.]

## 7. Providers and sharing

The current network features use:

- **Replit** to host the app API and operational quota database.
- **Geoapify** to provide city-search results.

The active mobile flow does not use Supabase for profile synchronization. The API still exposes protected `/api/me` profile routes that require a valid Supabase access token and use the authenticated owner for profile operations. The current mobile UI does not call these routes. This dormant, but reachable, cloud-profile capability must be either disabled before release or accurately documented and tested against the live Supabase project. The service-role key is not configured, so administrative account deletion is unavailable.

Soul Compass does not currently offer advertising or sell user profile data. [The controller must confirm this statement and update it before publication if the business model changes.]

## 8. Retention and deletion

Local profile information remains on your device until you use **Settings → Privacy → Delete local profile**, clear app data or uninstall the app. The in-app action removes the profile and cached chart from this device and returns the app to setup. Operating-system backups may retain a copy.

The Soul Compass chart endpoint was not found to persist birth requests or charts in its application database. Replit infrastructure logs and Geoapify provider logs have not been fully verified. The final policy must name the actual retention periods or criteria for each server/provider record.

You may contact the privacy address above to make a request about information processed by the service. [SET UP AND TEST A PROCESS FOR ACCESS, CORRECTION, DELETION, RESTRICTION, OBJECTION, PORTABILITY AND CONSENT WITHDRAWAL. Do not promise deletion from a provider unless the operator can request and verify it.]

## 9. Your rights

Depending on your location and the applicable law, you may have rights to access, correct, delete, restrict or object to processing, obtain a portable copy, withdraw consent and complain to a data-protection authority. Contact Soul Compass Support at soulcompass.support@gmail.com to submit a request.

**Controller and supervisory authority details:** [COMPLETE AFTER CONFIRMING THE OPERATOR'S ESTABLISHMENT AND APPLICABLE AUTHORITY.]

## 10. Children and age suitability

Soul Compass is intended for users aged 13 and older and is not intended for children under 13. This age statement is subject to review of applicable child-consent rules, store age ratings and the final content.

## 11. Changes and contact

We will update this policy when the app's data flows or providers change. The effective date and summary of material changes will appear at the top of this page.

Privacy and support contact: Soul Compass Support <soulcompass.support@gmail.com>. Please do not email your birth date, birth time, birthplace, screenshots containing your profile or other sensitive personal details unless the support team specifically explains a secure, necessary process.

---

## Owner/legal review checklist — remove this block from the public policy

- Confirm the operator's rights to the app and its content.
- Confirm the supplied public contact address is complete, plus publication/effective dates and stable policy URL before publication.
- Confirm the supplied postal address is complete and can receive legal notices.
- The owner selected a 13+ intended audience. Have a qualified adviser review child-consent rules and align store age ratings before release.
- Verify production Replit logs, database retention/backups, region and provider agreement.
- Verify Geoapify retention/role/DPA and current account configuration.
- Decide whether to disable the dormant protected `/api/me` routes or retain and disclose this cloud-profile capability; verify the live Supabase project and whether any cloud records exist before making that decision.
- Decide and document legal bases; review EU rights and international transfers.
- Verify the in-app local data reset and define the process for server/provider rights requests; do not imply that the reset deletes backups or provider/infrastructure records.
- Translate and proofread for the app's seven supported languages: English, Hungarian, Italian, German, French, Spanish and Russian.
- Obtain qualified legal review. This draft is not a declaration of GDPR compliance.
