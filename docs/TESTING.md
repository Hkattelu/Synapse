# Synapse Studio — Manual Testing Guide (Pre‑Launch QA and Onboarding)

This document provides simple, step‑by‑step instructions to verify Synapse Studio’s key features before launch and to help new engineers quickly validate the system locally.

Audience: QA, Makers, and new engineers.
Estimated time: 20–30 minutes for smoke tests, 45–60 minutes for full pass.

---

## 0) Prerequisites

- Windows with PowerShell (preferred)
- Node.js 20+ and npm
- Docker Desktop (optional; for staging checks)

Tip: Close any other processes using ports 5173 (Vite) or 8787 (API) before starting.

---

## 1) Local Setup

1. Install dependencies
   - In the repo root:
     ```powershell
     npm install
     ```
2. Start the backend API (Terminal A)
   ```powershell
   npm run server
   ```

   - Expected: API listens on http://localhost:8787
3. Start the frontend (Terminal B)
   ```powershell
   npm run dev
   ```

   - Expected: App available at http://localhost:5173
4. Health check the API (optional)
   ```powershell
   Invoke-RestMethod http://localhost:8787/api/health
   ```

   - Expected: JSON { ok: true } or similar

Troubleshooting:

- If the app can’t reach the API, confirm the Vite proxy is forwarding /api to :8787 and that CORS_ORIGIN permits http://localhost:5173.

---

## 2) Authentication Flow

Goal: Verify sign up, login, session persistence, and logout.

Steps:

1. Open http://localhost:5173
2. Navigate to Account/Sign In within the app.
3. Sign up with a new email and password.
   - Expected: You’re signed in; Account status shows the user email; session cookie (httpOnly) is set.
4. Refresh the page.
   - Expected: You remain signed in (session persists).
5. Log out.
   - Expected: You are signed out; protected actions prompt sign in.

API spot checks (optional):

```powershell
# After login, should return authenticated session info
Invoke-RestMethod http://localhost:8787/api/auth/session -Method GET -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession)
```

---

## 3) Membership / Export Gating

Goal: Ensure exports are gated by active membership and cannot be bypassed.

Steps:

1. While signed OUT: open Export dialog from any project.
   - Expected: Inline sign-in / sign-up UI; Start Export is not available.
2. Sign in (if not already).
3. While signed in WITHOUT membership: open Export dialog.
   - Expected: Donation/activation CTA shown; export is disabled.
4. Activate membership via demo endpoint (button in UI).
   - Expected: Membership status becomes active; export UI unlocks.
5. Start an export job.
   - Expected: Job is created on server; UI shows progress.
6. Wait for completion and download the file.
   - Expected: Video downloads successfully; file plays.

Authorization checks (server):

- Unauthenticated export POST → HTTP 401
- Authenticated but ineligible → HTTP 402 (Payment Required)

---

## 4) Projects and Media (Timeline Basics)

Goal: Validate basic editing and smart placement.

Steps:

1. Create a new blank project.
2. Add media to the Media Bin (drag & drop or upload):
   - A short screen recording (mp4)
   - A talking-head clip (mp4) or image placeholder
   - One audio file (mp3)
3. Drag assets to the timeline.
   - Expected: Suggested track badges and/or non-blocking suggestions appear (e.g., talking‑head → You track; audio → Narration track).
4. Move clips around and trim ends.
   - Expected: Snapping and timeline updates smoothly; preview responds.

---

## 5) Code Clips (Languages, Animations)

Goal: Verify code clip editing, language highlighting, and animation modes.

Steps:

1. Add a Code clip to the timeline.
2. In the Inspector:
   - Paste a small code snippet (e.g., JavaScript or Python).
   - Select the appropriate language.
   - Expected: Syntax highlighting applies immediately.
3. Try animation modes:
   - Typing
   - Line-by-line
   - Diff (paste before/after snippets)
   - Expected: Preview animates per selection; typing speed / intervals honored.

Optional spot checks for special languages:

- GLSL snippet (vertex/fragment) → highlighted
- GDScript snippet → highlighted

---

## 6) Backgrounds & Accessibility (Reduce Motion)

Goal: Verify backgrounds (color/gradient/image), subtle motion, and Reduce Motion behavior.

Steps:

1. Open Inspector → Visual → Backgrounds.
2. Try each background type:
   - Color
   - Gradient (should slowly rotate)
   - Image (pick one wallpaper)
3. If an animated GIF wallpaper is available:
   - Expected: Subtle animation by default.
4. Enable Reduce Motion (Inspector → Settings → Accessibility → Reduce motion)
   - Expected: Gradient rotation stops; image pan/zoom stops; animated GIFs display static fallback/thumbnail.

Performance guidance:

- Keep GIFs small to avoid heavy previews.

---

## 7) UI Modes (Simplified vs. Advanced)

Goal: Confirm mode switch and persistence.

Steps:

1. Use the UI Mode Toggle (top-right) to switch between Simplified and Advanced.
2. Reload the page.
   - Expected: Previously selected mode is restored.

---

## 8) Preview Overlay (Track Awareness)

Goal: Verify track-aware overlay during playback.

Steps:

1. Press Play in the preview.
2. Confirm overlay lists currently active tracks and playing item names.

---

## 9) AI – New Project from Repo

Goal: Validate the AI-assisted “New from Repo” flow.

Steps:

1. Go to Projects (Dashboard) → New from Repo.
2. Enter a small public Git repo URL (choose a lightweight repo to keep it quick; e.g., https://github.com/sindresorhus/slugify).
3. Optionally set a branch; leave default otherwise.
4. Toggle “Open Studio after generation” ON.
5. Generate.
   - Expected: Server clones shallowly (depth 1), scans for representative files, and proposes a short timeline (titles + code segments) you can edit.
6. Review and make small edits; ensure the generated items load in the timeline.

Notes:

- No repo code is executed.

---

## 10) Export End‑to‑End (Smoke)

Goal: Confirm end‑to‑end export pipeline.

Steps:

1. Ensure membership is active (see Section 3).
2. Start an export from a small timeline.
3. Observe progress UI; wait until completion.
4. Download and play the output.

Expected:

- File is written to server/output and downloadable via the app.

---

## 11) Electron (Desktop) — Optional

Goal: Validate desktop packaging basics and secure preload bridge.

Steps:

1. Dev mode pointing at Vite:
   ```powershell
   npm run desktop:dev
   ```

   - Expected: Electron window loads the dev server; only a frozen, namespaced API (window.SynapseFS) is exposed.
2. Start packaged app from built web bundle:
   ```powershell
   npm run build
   npm run desktop:start
   ```
3. Quick smoke:
   - Open a project
   - Perform a preview
   - Confirm external links open in system browser; in‑window http/https navigations are blocked.

Security posture:

- contextIsolation: true; nodeIntegration: false; sandbox: true.

---

## 12) API Smoke Tests (Optional)

Run these after starting the server to double-check:

```powershell
# Health
Invoke-RestMethod http://localhost:8787/api/health

# Session (unauth) → authenticated=false
Invoke-RestMethod http://localhost:8787/api/auth/session

# Render endpoints (unauth) should refuse or require membership
Invoke-RestMethod http://localhost:8787/api/render/invalid/status
```

---

## 13) Automated Tests

Run unit/UI tests:

```powershell
npm test
```

Expected:

- Tests pass (or known flakes documented).

---

## 14) Staging (Optional)

If you need to verify staging with Docker Compose, see docs/server/STAGING.md. Quick outline:

```powershell
# On staging host (or local with Docker Desktop)
# Copy env and bring up the API
# Details in docs/server/STAGING.md
```

---

## 15) Pre‑Launch Checklist (PH)

Before shipping to Product Hunt, confirm:

- [ ] Install, login, and membership activation flow
- [ ] Create/edit timeline with code + media + audio
- [ ] Backgrounds and Reduce Motion behave as expected
- [ ] Export works end‑to‑end on a short project
- [ ] AI “New from Repo” works on a small public repo
- [ ] Electron (if included) opens and basic flows work
- [ ] Landing page meta and assets are complete

See docs/PRODUCT_HUNT_LAUNCH.md for the full launch plan and on‑page checklist.

---

## 16) Troubleshooting FAQ

- Frontend can’t reach API
  - Ensure npm run server is running on port 8787
  - Confirm Vite proxy configuration forwards /api → 8787
  - Check CORS_ORIGIN includes http://localhost:5173
- Export never finishes
  - Try a very short timeline first
  - Check server logs for render errors (Remotion bundling or composition ID)
- Membership not activating
  - Use the demo payment/activation button in the UI while signed in
  - Check /api/auth/session and /api/membership/status on the server
- Electron won’t start
  - Run npm run build then npm run desktop:start
  - Ensure electron and electron-builder are installed (npm install)

---

## 17) Notes for New Engineers

- Start with README.md → Quick Start (PowerShell)
- Skim docs/EducationalFeatures.md and docs/BACKGROUNDS.md for feature context
- Use this TESTING guide for a fast local validation pass
- Server config and endpoints: docs/server/README.md
- Launch process: docs/PRODUCT_HUNT_LAUNCH.md
