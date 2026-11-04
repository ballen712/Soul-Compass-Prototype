# Phase 3: external setup checklist

**Status: code prepared; external services are not configured.** No Supabase migration or RLS policy has been applied to a live project. No private key has been requested, inspected or added, and no paid plan/service has been enabled.

Do not paste credentials into chat. Keep this checklist open while configuring the dashboards.

## 1. Choose a free Supabase development project

1. Sign in to Supabase and choose an existing **Free** project, or create one on Free.
2. Keep it on Free. Do not enable paid add-ons or upgrade.
3. Record the project URL and public **publishable key** (or legacy **anon** key).
4. If there is already a `public.profiles` table, **stop before running the migration**. It must be reconciled without deleting existing data. The migration deliberately fails instead of replacing an existing table.

## 2. Apply and check the database migration

1. Open the project's SQL Editor.
2. Run `supabase/migrations/202611040001_secure_profiles.sql` from this repository.
3. Confirm `public.profiles` has RLS enabled and four policies: `profiles_read_own`, `profiles_insert_own`, `profiles_update_own`, `profiles_delete_own`.
4. In the development project, run `supabase/tests/profile_rls.sql`. It creates two temporary test identities inside a transaction and ends with `ROLLBACK`. All assertions must pass. If anything fails, roll back the transaction and stop.
5. Never grant `anon` profile access or turn RLS off to resolve an error.

## 3. Enable email one-time codes

1. In Supabase **Authentication → Sign In / Providers**, enable Email.
2. Open the **Magic Link / OTP** email template. This implementation uses entered codes, not email-link callbacks.
3. Include the token variable in the message, for example: `<p>Your Soul Compass code is {{ .Token }}</p>`.
4. Leave secure expiry/rate limits enabled. A code can normally be requested only once per 60 seconds; keep expiry short enough for your development workflow.
5. Check delivery restrictions before testing. Supabase's default mailer is for development and can restrict recipients to authorized team addresses and has low limits. It is not a public production email service.
6. No SMTP service was added. If wider delivery is needed later, first choose an existing or free SMTP service within its limits; do not pay or upgrade without approval.

## 4. Configure Google

1. In Google Cloud / Google Auth Platform, select or create a project.
2. Configure the OAuth consent screen with the Soul Compass app name and the minimum sign-in scopes (`openid`, email, profile).
3. While the app is in Testing, add the Google addresses you intend to test as test users.
4. Create an OAuth client of type **Web application** for the browser-based Supabase OAuth flow.
5. Under **Authorized redirect URIs**, enter the exact Supabase callback URL shown in Supabase's Google provider settings. It normally has this form: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
6. Add the real app web origins under Authorized JavaScript origins as appropriate; an origin has no `/auth/callback` path.
7. Enable Google in Supabase and enter the Google client ID and client secret **there**. The Google secret must not go in the app, repository, chat or an `EXPO_PUBLIC_` variable.
8. No paid Google API is required for these basic sign-in scopes. Do not enable unrelated paid APIs.

## 5. Allow the app's return addresses in Supabase

In Supabase **Authentication → URL Configuration**:

1. Set Site URL to the actual web app URL you are using.
2. Allow its exact `/auth/callback` URL. For the current preview:
   `https://18553180-b3aa-482f-b49e-30d7349b28c3-00-1qw3hq5kedd2m.expo.archer.replit.dev/auth/callback`
3. Allow the native callback `soul-compass://auth/callback`.
4. After publishing, obtain the actual published URL and add its exact callback. Do not guess a production URL or use a broad production wildcard.
5. Native Google OAuth needs a development/standalone build that owns the `soul-compass` scheme. Do not assume Expo Go handles this custom scheme. Email code entry does not require a browser callback.

The two Google/Supabase redirects are different: Google returns to **Supabase**, then Supabase returns to **Soul Compass**.

## 6. Add configuration securely in Replit

Use the workspace Secrets/configuration interface—not chat and not committed `.env` files.

| Name | Where used | Value |
|---|---|---|
| `SUPABASE_URL` | API server | Supabase project URL |
| `SUPABASE_ANON_KEY` | API server | Same public publishable/legacy anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | API server only | Server administrative key; required only for confirmed account deletion |
| `EXPO_PUBLIC_SUPABASE_URL` | Expo bundle | Same project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Expo bundle | Public publishable/legacy anon key **only** |
| `CORS_ALLOWED_ORIGINS` | API server | Comma-separated exact web app origins, particularly custom/published domains |

`EXPO_PUBLIC_` values are deliberately visible to anyone inspecting the bundle. **Never put a service-role, `sb_secret_`, Google secret, password or database connection string there.** The existing `EXPO_PUBLIC_DOMAIN` points to the app API host, not to Supabase; do not repurpose it.

Keep administrative keys server-side in Secrets. Do not paste their values here. Use matching environment scopes for the intended preview/deployment. Then restart the API and Expo services; public Expo variables need a fresh bundle/export.

## 7. Live verification before enabling cloud accounts for users

Use two development accounts and repeat:

- First-time and returning Google sign-in.
- First-time and returning email code sign-in; invalid and expired codes.
- Reopen the app: session restored and cloud profile loaded.
- Import an existing local profile with confirmation; interrupt/retry it.
- Ensure existing cloud data is not overwritten by a conflicting local profile.
- Sign out A, sign in B on the same device: no A profile, collection or cached chart visible.
- Sign in as A on another device, save there, refresh here; stale simultaneous edits return a conflict rather than overwriting.
- Verify RLS directly with the rollback SQL test and with actual user JWT requests; anonymous/other-user reads and writes must fail.
- Confirm deletion within 15 minutes of a fresh sign-in; check the Auth user and dependent profile are gone, and the other account is untouched.
- Confirm CORS permits the actual web origin; no birth details or credentials appear in logs.

Supabase access tokens can remain valid until their configured expiry after sign-out; SDK sign-out clears this device's credentials and UI immediately. Use an appropriately short access-token lifetime, and do not claim immediate universal JWT revocation. Account deletion removes the Auth user, and the profile FK cascades.

**STOP here until configuration is complete.** Real provider login, live RLS enforcement, cross-device behavior and deletion are not yet verified. No paid plan is required for the implementation or limited Free-tier development. Free quotas and default email delivery restrictions still apply; production scale, app-store distribution and any optional services must be assessed separately without purchasing anything.

References: [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google), [native deep links](https://supabase.com/docs/guides/auth/native-mobile-deep-linking).
