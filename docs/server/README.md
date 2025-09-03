# Server (Synapse)

Overview
- Stack: Node.js (ESM) + Express 5, JSON APIs
- Purpose: Auth/licensing, server-side video rendering (Remotion), AI-assisted composition generation from a Git repo, contact email endpoint.
- Default port: 8787 (Vite proxies `/api` to this in development)

Quick start (PowerShell)
- Install deps: npm install
- Start backend: npm run server
- Health check: Invoke-RestMethod http://localhost:8787/api/health

Environment variables
- PORT: default 8787
- JWT_SECRET: secret for signing auth cookies/JWTs (dev default present; set in prod)
- CORS_ORIGIN: comma-separated allowed origins (defaults to http://localhost:5173, http://127.0.0.1:5173)
- SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO: configure outbound email (contact form). If not set, server logs emails instead of sending.
- REMOTION_COMPOSITION_ID: default MainComposition
- REMOTION_ENTRY: path to the Remotion entry (defaults to src/remotion/index.ts)
- RENDER_OUTPUT_DIR: where rendered files are written (defaults to server/output)

API surface
- Auth (/api/auth)
  - POST /register {email, password} -> sets httpOnly cookie; returns {user}
  - POST /login {email, password} -> sets httpOnly cookie; returns {user}
  - POST /logout -> clears cookie
  - GET /me -> returns {user} if authenticated
- Licensing (/api/license)
  - POST /activate {licenseKey} [auth] -> {ok, license}
  - GET /status [auth] -> {active, plan?}
- Rendering (/api/render)
  - POST / {timeline, mediaAssets, settings, exportSettings} -> {jobId}
  - GET /:id/status -> {status, output?}
  - GET /:id/download -> downloads file when completed
- AI (/api/ai)
  - POST /generate-from-repo {repoUrl, branch?} -> proposal {timeline, mediaAssets, settings, exportSettings}
    - Implementation note: clones shallowly (depth 1). No repo code is executed.
- Email (/api/email)
  - POST / {name, email, message} -> {queued: true, messageId?}

Rendering notes
- Uses @remotion/bundler and @remotion/renderer to bundle src/remotion/index.ts and render the composition id MainComposition.
- Outputs written to server/output and also exposed at /downloads for simple retrieval.
- Current implementation runs renders in-process and tracks progress with a simple in-memory job map.

Development with the web app
- In one terminal: npm run dev (Vite, port 5173)
- In another terminal: npm run server (Express, port 8787)
- The Vite dev server proxy forwards /api requests to the backend.

Security & persistence
- This scaffold uses in-memory stores for users and licenses; replace with a persistent database for production.
- Use secure cookies (secure: true) and HTTPS in production.

