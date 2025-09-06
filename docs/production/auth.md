# Authentication options

Goal: enable sign‑in for the webapp in production with minimal setup, aligned with our hosting choice and current code.

Two paths are viable. This doc describes what must be configured for each and what app changes are implied. No implementation is performed here.

## Option A: Keep current server‑managed auth (username/password + JWT cookie)

Current state in this repo:
- API exposes `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` (cookie‑based).
- Client (webapp) expects `/api/auth/session` and related endpoints; there are mismatches to resolve before production (see owner actions).

Configuration items to document and decide:
- Cookie attributes for cross‑origin deployments
  - If the webapp and API are on different domains, configure the cookie with `SameSite=None; Secure` and a proper `Domain` so that XHR/fetch requests include it.
  - Alternatively, move to bearer tokens carried in the `Authorization` header and avoid cookies entirely (requires small client changes).
- CORS and credentials
  - Ensure `CORS_ORIGIN` includes the exact webapp origin(s).
  - Client requests must set `credentials: 'include'` (already done in code).
- Environment variables (API)
  - `JWT_SECRET` — required
  - `CORS_ORIGIN` — required
- User persistence
  - Today, users are stored in memory in `server/services/auth.mjs` while other entities use a JSON file. Production may lose users on restart. Decide whether this is acceptable for an MVP or if we should switch to file‑based or external storage.

Implications:
- Lowest change surface but requires endpoint alignment and cookie strategy decisions before go‑live.

## Option B: Firebase Authentication

Why: managed auth with email/password and OAuth providers, works with Vercel/Cloud Run, and simplifies account recovery and security.

Configuration items to document and decide:
- Identity providers to enable
  - Email/Password (recommended for MVP)
  - Google, GitHub (optional)
- Redirect/callback URLs
  - Add both production and staging webapp URLs
- Client credentials (webapp)
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`
- Server verification (API)
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (service account)
- Session management assumptions
  - Client obtains an ID token from Firebase and sends it with API requests (e.g., `Authorization: Bearer <id_token>`)
  - API verifies the token per request and constructs user context from the verified claims
- Application adjustments required (future task)
  - Add Firebase Auth SDK to the webapp and wire it into `AuthProvider`
  - Update API routes to accept and verify Firebase ID tokens instead of (or alongside) JWT cookies

## Decision needed: which auth provider?

The issue allows “Firebase or Vercel for auth.” Since this repo is not a Next.js app and does not use NextAuth, there is no built‑in “Vercel auth” primitive here. Please select one of:

1. Proceed with current server‑managed auth for MVP (align endpoints + cookie strategy), or
2. Adopt Firebase Authentication (requires small app/server changes; safer long‑term).

Record the decision in `docs/owner-actions-and-gaps.md` and proceed with the corresponding configuration.
