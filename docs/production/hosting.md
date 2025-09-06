# Hosting plan (initial production)

Goal: low‑traffic launch using managed hosting. This plan documents what must be configured to serve the webapp and the API, without changing this repository.

Two viable setups are outlined; pick one and complete the configuration checklists.

## Option A (recommended for MVP): Vercel (webapp) + Cloud Run (API)

Why: the repo already includes a Dockerfile for the API. Cloud Run runs that container with HTTPS and autoscaling. Vercel serves the static web build globally and can forward `/api/*` requests to the Cloud Run URL or to an `api.` subdomain.

### Webapp on Vercel

- Project/app creation
  - Framework preset: “Vite” (static build)
  - Root directory: repo root
  - Output directory: `dist/`
- Runtime/build
  - Node version: 20 (LTS), aligned with CI and Docker base image.
  - Build output type: Static assets
  - Install/Build commands: use defaults from Vercel’s Vite preset (no code changes needed here)
- Environment variables
  - `VITE_ALLOW_WEB_NO_LICENSE` — see overview; decide `true` (open beta) vs `false` (enforce licensing UI)
- DNS / custom domain / TLS
  - Attach `app.<your-domain>` (or use the auto‑generated `*.vercel.app` domain)
  - TLS handled by Vercel
- Routing
  - Either: configure a rewrite from `/api/*` to your API base URL (Cloud Run service HTTPS URL)
  - Or: serve API on `api.<your-domain>` and use absolute URLs in the client (would require a small code change; today the client calls relative `/api/*`)
- Region / scalability
  - Use Vercel’s default edge CDN for static assets
  - No server runtime required for the webapp

### API on Google Cloud Run (container)

- Service creation
  - Image/source: build from this repo’s `Dockerfile`
  - Startup command: the image’s default (`node server/index.mjs`)
- Runtime
  - CPU/Memory: start with 1 vCPU, 1–2 GiB RAM (Remotion can be memory‑heavy)
  - Concurrency: `1` for initial stability (matches `RENDER_CONCURRENCY=1`)
  - Min instances: `0` (scale‑to‑zero acceptable for low traffic)
  - Max instances: `1–3` (to cap costs for MVP)
  - Region: choose close to majority of users (e.g., `us-central1`)
- Environment variables
  - Set all listed in `docs/production/overview.md` (JWT_SECRET, CORS_ORIGIN, SMTP_*, EMAIL_*, REMOTION_*, etc.)
  - Ensure `CORS_ORIGIN` includes the exact Vercel domain(s)
- Networking / ingress
  - Allow unauthenticated invocations (public HTTPS) or front with Firebase Hosting/CDN if desired
- DNS / TLS
  - Optionally map `api.<your-domain>` to the Cloud Run service via Cloud Run custom domains
- Downloads
  - Exposed at `GET /downloads/*`; storage is ephemeral by default. For persistence, plan a follow‑up to write to object storage (GCS bucket) and serve via signed URLs.

## Option B: Vercel (webapp) + Firebase Hosting (proxy) → Cloud Run or Functions (API)

Why: single Firebase project can front your API behind the same domain as the webapp using Hosting rewrites. Caution: the existing API renders video using Remotion, which is not suited to short‑lived Functions; prefer Cloud Run as the execution target.

- Webapp: deploy static build to Firebase Hosting (or still on Vercel; pick one)
- API: deploy the same container to Cloud Run, and set a Hosting rewrite `"/api/**" → Cloud Run service`
- Keep all config items from Option A for the API runtime.

## Configuration items (by component)

For each item below, ensure you’ve captured the exact value/decision in your provider dashboards.

### Webapp

- Project/app created on chosen host (Vercel or Firebase Hosting)
- Build output directory set to `dist/`
- Node runtime 18/20
- Env vars set (at least `VITE_ALLOW_WEB_NO_LICENSE`)
- Domain attached and verified (e.g., `app.<your-domain>`)
- TLS enabled (managed by provider)
- Routing: `/api/*` rewrite to API base URL or same‑origin API configured
- Region: default edge/CDN

### Server/API

- Service created (Cloud Run recommended)
- Container built from this repo’s `Dockerfile`
- Runtime sizing: 1 vCPU / 1–2 GiB RAM; autoscaling 0–1 (or a small max)
- Environment variables set (JWT/CORS/SMTP/Remotion)
- Domain: default Cloud Run URL or custom `api.<your-domain>`
- TLS: managed by provider
- CORS configured to allow the webapp origin(s)
- Downloads strategy decided (ephemeral vs external object storage)

## Ambiguities to confirm before go‑live

- API execution model: Confirm Cloud Run (container) vs Functions. For Remotion render jobs, Cloud Run is strongly preferred.
- Cookie vs bearer strategy: Current code sets a `token` cookie with `sameSite: 'lax'`. If webapp and API are on different domains, cross‑site XHR will not send this cookie. Options:
  - Host API under the same site (subdomain with proper cookie domain + `SameSite=None; Secure`), or
  - Switch the client to send bearer tokens in `Authorization` headers. This requires small code changes.
- Remotion system dependencies: Alpine base image may be missing libraries for Chromium/FFmpeg. If renders fail in Cloud Run, adopt a Debian base image and install required packages. This repo does not include those changes yet.
- Object storage: Decide whether rendered files must persist across restarts. If yes, provision a bucket and update the API (separate task) to write there.
- Exact provider choice: Whether to consolidate on Firebase Hosting (web + proxy) or keep Vercel for the webapp.
