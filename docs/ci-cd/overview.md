# CI/CD overview

Scope: describe continuous integration for this repo (build, lint, type‑check, test) and continuous delivery to the chosen hosts for preview and production. This is process documentation only; no workflow code is included here.

## Continuous Integration (CI)

What CI should run for each push/PR:

- Install dependencies (Node 22)
- Lint: `eslint .`
- Format check: `prettier --check .`
- Type‑check: `tsc --noEmit`
- Tests: `vitest --run`
- Build webapp: Vite build produces `dist/`
- Build API container image (for deployment stages)

Triggers:
- Pull requests targeting `main`
- Pushes to any branch
- Optional: tags matching `v*.*.*` for release creation

Artifacts:
- Web: `dist/` build as an artifact (optional if deploying directly)
- API: container image pushed to a registry (e.g., `gcr.io/<project>/synapse-api:<sha>`)

## Continuous Delivery (CD)

Environments:
- Preview: every PR deploys a web preview (Vercel) and, optionally, a staging API service (separate Cloud Run revision or staging service)
- Production: merges to `main` (or a `release/*` branch) trigger production deploys after approval

Stages:
1) Web preview deploy (Vercel) on PR open/update
2) API staging deploy (Cloud Run) on PR label or branch prefix (optional to control costs)
3) Production web deploy on `main` (Vercel)
4) Production API deploy on `main` tag/release (Cloud Run)

Promotion strategy:
- Web: Vercel automatic previews; promote to production when PR merges
- API: build once per commit, deploy to staging service; promote the same image digest to production after approval

Required secrets (in GitHub repository or environment secrets):
- For Vercel deploys
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- For Google Cloud Run deploys
  - `GCP_PROJECT_ID`, `GCP_REGION`
  - `GCP_SA_KEY` (JSON for a service account with Cloud Run Admin, Storage Admin if pushing to GCR/Artifact Registry)
- Application secrets (provided at host level, not stored in GitHub unless necessary)
  - API: `JWT_SECRET`, `CORS_ORIGIN`, SMTP/EMAIL variables, REMOTION_* variables
  - Web: `VITE_ALLOW_WEB_NO_LICENSE` and any auth provider variables (if Firebase)

Failure and rollback expectations:
- Web (Vercel)
  - Failed builds do not affect production; previews are isolated
  - Rollback to any previous deployment is one click in Vercel
- API (Cloud Run)
  - Each deploy creates a new revision; traffic can be shifted/rolled back instantly to a prior revision
  - Health checks: use `/api/health` for post‑deploy verification

## Release management

- Versioning: semantic versioning (`MAJOR.MINOR.PATCH`), starting at `0.1.0`
- Changelog: short human‑written notes per release focusing on user‑visible changes
- Releases: create a GitHub Release for each production deployment; attach links to the Vercel deployment and API revision
- Approvals: require a manual approval step for promoting API images from staging to production
