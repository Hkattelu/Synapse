# Owner actions and gaps

This checklist consolidates all items that require repository owner access/decisions or information that is currently unknown. Check off what you complete and record final values where indicated.

## Hosting/provider decisions

- [ ] Final selection of hosting providers
  - Webapp: Vercel vs Firebase Hosting → Decision: `TODO`
  - API: Cloud Run (container) vs Functions → Decision: `TODO`
- [ ] Create accounts/projects on chosen providers and enable billing
  - Vercel project: `TODO`
  - Google Cloud project id: `TODO`
  - Firebase project id (if used): `TODO`

## Domains and DNS

- [ ] Purchase/confirm domain ownership: `TODO`
- [ ] Choose production and staging hostnames
  - Webapp (prod/stage): `TODO` / `TODO`
  - API (prod/stage): `TODO` / `TODO`
- [ ] Configure DNS records per provider instructions (CNAME/ALIAS for webapp, custom domain mapping for Cloud Run if used)

## Authentication

- [ ] Final choice of auth provider
  - [ ] Keep server‑managed JWT cookie auth for MVP, or
  - [ ] Adopt Firebase Authentication
- [ ] Identity providers to enable (if Firebase): Email/Password, Google, GitHub → Decision: `TODO`
- [ ] Define redirect/callback URLs (staging + production): `TODO`
- [ ] Cookie strategy (if server‑managed auth)
  - [ ] Same‑origin vs cross‑origin deployment
  - [ ] Cookie attributes (`SameSite=None; Secure` + `Domain=...`) if cross‑site

## Secrets and environment variables (must be provisioned by owner)

API (Express):

- [ ] `JWT_SECRET` — REQUIRED. Value: `TODO`
- [ ] `CORS_ORIGIN` — REQUIRED. Value(s): `TODO`
- [ ] `REMOTION_COMPOSITION_ID` — Value: `TODO` (default `MainComposition`)
- [ ] `REMOTION_ENTRY` — Absolute path to Remotion root entry. Value: `TODO`
- [ ] `RENDER_CONCURRENCY` — Value: `1` (recommended for MVP)
- [ ] `RENDER_OUTPUT_DIR` — Value: `TODO` (ensure persistence strategy decided)
- [ ] SMTP/Email (optional): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_TO`

Webapp (Vite):

- [ ] `VITE_ALLOW_WEB_NO_LICENSE` — Decision: `true` for open beta or `false` to enforce license gate in web build

If using Firebase Auth:

- [ ] Web: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
- [ ] API: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

CI/CD secrets (in GitHub):

- [ ] Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Google Cloud: `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SA_KEY` (JSON)

## Provider quotas/regions

- [ ] Select regions (web + API). Suggested: `us-central1` for API. Final: `TODO`
- [ ] Set autoscaling caps to control costs (Cloud Run max instances: `1–3` for MVP)

## Access/permissions for collaborators

- [ ] Grant deploy/view access in Vercel
- [ ] Grant deploy/admin roles in Google Cloud/Firebase (principle of least privilege)

## Legal/compliance

- [ ] Privacy Policy and Terms of Service links to include in the website footer: `TODO`
- [ ] Email compliance (From/Reply‑To addresses, unsubscribe if applicable)

## Repository‑specific unknowns and open questions

- API ↔ client endpoint mismatches to resolve (pick one path and align):
  - Client calls `/api/auth/session`; server provides `/api/auth/me`.
  - Client posts `/api/contact`; server exposes `/api/email`.
  - Client references `/api/membership/status`; server has no such route (membership is updated via `/api/payments/demo`).
- User persistence: auth service currently stores users in memory; other entities use a JSON file. Decide persistence strategy for MVP.
- Cookie vs bearer auth: if webapp and API are on different domains, `sameSite: 'lax'` cookies will not be sent on XHR. Choose cookie attributes and domain or pivot to bearer tokens.
- Remotion dependencies: Alpine base image may lack required libraries for Chromium/FFmpeg. If renders fail on Cloud Run, we’ll need a Debian base image and packages (follow‑up task).
- Render output persistence: decide whether to configure object storage now or accept ephemeral files for the pilot.
