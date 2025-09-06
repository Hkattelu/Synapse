# Continuous feedback loop (first clients)

Purpose: collect, organize, prioritize, and act on feedback from the first client cohort, then close the loop with them. Keep this tool‑agnostic; choose the tools you already use.

## Feedback intake channels

- In‑app contact form (API: `POST /api/contact` — see gaps below)
  - Visible from the app’s UI (Landing/Downloads pages). Messages are emailed when SMTP is configured; otherwise the server logs them.
- Direct email alias
  - Create a shared alias (e.g., `feedback@<your-domain>`) and route it to the team
- Slack/Discord shared channel with pilot clients (optional)
  - Keep one channel per cohort to avoid fragmentation
- Interviews or office hours (optional)
  - Schedule 15–30 minute sessions to observe usage and gather qualitative insights

## Issue and bug reporting expectations

Ask clients to include:
- Summary, steps to reproduce, expected vs actual
- Sample project or files (if possible)
- Browser/OS and approximate time

Triage guidelines:
- Security and data loss → highest priority
- Rendering failures and blockers → next priority
- UI papercuts and suggestions → backlog unless frequently reported

## Feature requests

- Capture problem statements, not solutions
- Tag requests with areas (e.g., “export”, “timeline”, “backgrounds”)
- Note frequency (how many clients asked) and impact (est. value/effort)

## Cadence and ownership

- Triage cadence: twice a week during pilot; daily during launch week
- Owner: one person accountable to review all new items and update statuses
- SLA (pilot): acknowledge within 24h on business days; updates weekly

## Success metrics to monitor (MVP)

- Activation: number of users who complete a first render
- Time‑to‑first‑render (median)
- Render success rate (completed / attempted)
- Top 3 failure reasons (categorize exceptions/logs)
- Feedback volume per week and resolution time

## Closing the loop

- Release notes
  - Write short notes for each deploy to staging/production summarizing fixes and new capabilities
- Targeted updates
  - Reply on the original intake channel when a client’s issue is fixed; link to the release notes
- Confirmation & follow‑up
  - Ask clients to retry; confirm resolution or reopen with details

## Known gaps impacting feedback collection

- Endpoint mismatch: the client posts to `/api/contact`, while the server currently exposes `/api/email`.
  - Decision: align on one path (recommend `/api/contact`) and adjust either the router or the client.
- SMTP optionality: without SMTP env vars, the server logs contact messages. For real email delivery, set up SMTP (see `docs/production/overview.md`).
