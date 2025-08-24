# Authentication and Membership Gating

This document describes the minimal authentication, membership/entitlement model, and export gating added to Synapse Studio.

## Summary

- A lightweight Node/Express API is included in `server/`.
- Users can sign up, sign in, and sign out. Sessions are persisted via an httpOnly cookie.
- Each user may hold a membership (entitlement). Membership is activated by a payment/donation.
- Video export is enforced server-side: creating an export job requires an authenticated user with an active membership. The client cannot bypass this check.

## Data Model

Stored in `data/db.json` (simple JSON storage for development):

- `users`: `{ id, email, name, passwordHash, createdAt }`
- `sessions`: `{ id, userId, createdAt }` (referenced by `sid` cookie)
- `memberships`: `{ id, userId, status, activatedAt, expiresAt, source, lastPaymentId }`
- `payments`: `{ id, userId, amount, currency, provider, status, createdAt }`
- `jobs`: export jobs simulated by the server `{ id, userId, status, progress, outputFilename, ... }`

Membership semantics (development default):

- Activated by a one-time donation (demo), valid for 30 days from activation.
- `status: 'active'` and `expiresAt` in the future => eligible for export.

## API Endpoints

Auth/session

- `POST /api/auth/signup` { email, password, name? } → { user, membership }
- `POST /api/auth/login` { email, password } → { user, membership }
- `POST /api/auth/logout` → { ok }
- `GET  /api/auth/session` → { authenticated, user?, membership? }

Membership/payment

- `GET  /api/membership/status` (auth) → membership
- `POST /api/payments/demo` (auth) { amount?: number, currency?: string, durationDays?: number } → { ok, membership }
  - Demo-only flow to activate membership locally (no real payment gateway).

Export jobs (server-enforced authorization)

- `POST /api/export/jobs` (auth + membership) { jobId, project, settings, outputFilename } → { id, status }
- `GET  /api/export/jobs/:id` (auth) → job state `{ status, progress, outputPath? }`
- `POST /api/export/jobs/:id/cancel` (auth) → job

Server simulates progress and marks jobs complete. The client polls job status and updates the UI.

## Client Integration

- `AuthProvider` (`src/state/authContext.tsx`) exposes `authenticated`, `membership`, and actions.
- `AccountStatus` (`src/components/AccountStatus.tsx`) shows current user and membership; supports sign in/up/out.
- `ExportDialog` gates export:
  - If unauthenticated, renders an inline sign in/up form.
  - If authenticated without membership, renders a donation CTA that activates membership via the demo endpoint.
  - If eligible, shows presets/settings and enables the Start Export button.
- `ClientExportManager` (`src/lib/exportManagerClient.ts`) creates a server export job and polls server status; errors with 401/402 are surfaced in the UI.

## Running locally

- Start API server (port 8787):

```bash
npm run server
```

- Start Vite dev server (port 5173 by default):

```bash
npm run dev
```

Vite is configured to proxy `/api/*` to the API server during development.

## Enforcement points

- UI: Export button is disabled unless authenticated and membership is active.
- Server: `POST /api/export/jobs` is protected by `requireMembership` middleware. Requests from unauthenticated users return HTTP 401; authenticated but ineligible users return HTTP 402 (Payment Required).

## Notes and next steps

- Payment provider is stubbed as a demo donation endpoint. Swap with a real provider (e.g., Stripe Checkout + Webhook) to replace `POST /api/payments/demo` and call `activateMembership()` upon confirmation.
- For production, replace JSON storage with a durable database and secure cookies over HTTPS.
- If a free tier or trial exports are desired, adjust `requireMembership` to allow N free jobs and record usage per user.
