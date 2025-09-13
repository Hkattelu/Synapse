# Synapse Studio: Refined Launch Roadmap (v2)

This document outlines a revised, time-boxed launch plan for Synapse Studio. The core structure remains, but we've introduced key phases for **hardening, user feedback, and post-launch support** to reduce risk and ensure a higher quality release.

---

### ## Key Roles

- **Engineer 1 (Backend):** Auth/licensing, render API, AI repo generator, email SMTP, performance, error handling.
- **Engineer 2 (Frontend):** Export wiring, AI UI, contact form, account/licensing UI, desktop polish.
- **Engineer 3 (Infra/DevOps):** Env/secrets, CI, deployment, TLS, monitoring/alerts, packaging automation.
- **Marketing, CEO, Client Relations:** Parallel tracks for launch prep, strategy, and support.

---

### ## Revised Launch Timeline

#### ### Phase 0: Foundations (Day 0–1)

- **Task:** Backend service up locally and behind Vite proxy (Engineer 3)
- **Task:** Environment and secrets setup (Engineer 3)
- **Task:** CI smoke checks for server (Engineer 3)

#### ### Phase 1: Core Features & Auth (Day 1–3)

- **Task:** Persist auth to file DB and outline DB migration (Engineer 1)
- **Task:** Licensing MVP (Engineer 1, Engineer 2)
- **Task:** Payments demo validation (Engineer 1)
- **Dependency:** "Foundations" complete.

#### ### Phase 2: Rendering Pipeline (Day 2–5)

- **Task:** Server-side Remotion rendering API (`/api/render`) solidified (Engineer 1)
- **Task:** Frontend wiring for export and downloads UI (Engineer 2)
- **Task:** Implement performance/limits (concurrency, timeouts) (Engineer 1)
- **Dependency:** Foundations & Auth stable.

#### ### Phase 3: AI Composition (Day 4–6)

- **Task:** Backend heuristic for `/api/ai/generate-from-repo` (Engineer 1)
- **Task:** Frontend UX for "New from repo" flow (Engineer 2)
- **Task:** Docs for AI generation feature (Engineer 2)
- **Dependency:** Foundations complete.

#### ### Phase 4: Outbound Comms (Day 3–4)

- **Task:** Finalize SMTP email transport (Engineer 1)
- **Task:** Frontend UX for contact form (Engineer 2)
- **Dependency:** Foundations complete.

---

### ### **⭐ NEW: Phase 5: Hardening & Early Feedback (Day 6–8)**

_This phase is dedicated to integration testing, bug fixing, and gathering critical feedback before the final deployment._

- **Task: Internal User Acceptance Testing (UAT)** (CEO, Client Relations, Marketing)
  - **Goal:** Run through a checklist of critical user journeys (signup, repo-gen, render, export).
  - **Outcome:** Identify and file bugs from a non-technical user's perspective.
- **Task: Invite Early Supporters for Feedback** (CEO, Client Relations)
  - **Goal:** Onboard 5-10 trusted users to a staging environment.
  - **Outcome:** Gather high-quality feedback and identify show-stopping issues before the public launch.
- **Task: Dedicated Bug Bash & Hardening** (All Engineers)
  - **Goal:** Prioritize and fix all critical bugs reported from UAT and early supporters.
  - **Outcome:** A stable, high-confidence release candidate.
- **Dependency:** All core features (Phases 1-4) are functionally complete.

---

### ### Phase 6: Release Engineering & Infra (Day 9–10)

- **Task:** Deploy backend to production (Engineer 3)
- **Task:** Final staging smoke tests against production-like environment (Engineer 3)
- **Task:** Finalize Desktop shell packaging (Engineer 2, Engineer 3) - _Still optional if time is tight._
- **Dependency:** "Hardening & Feedback" phase is complete and a release candidate is approved.

### ### **⭐ NEW: Phase 7: Launch & Post-Launch Support (Day 11+)**

_The launch is the starting line. This phase ensures we are prepared for immediate user activity and issues._

- **Task: Launch Day Execution** (Marketing, CEO)
  - **Goal:** Execute Product Hunt launch plan, send out comms, and engage with the community.
- **Task: Post-Launch Monitoring** (Engineer 3)
  - **Goal:** Actively monitor logs, alerts, and system metrics (render times, error rates).
- **Task: "Day 1" Support & Hotfix Plan** (All Engineers, Client Relations)
  - **Goal:** Establish an on-call rotation for the first week.
  - **Outcome:** A clear, fast process for triaging incoming user feedback/bugs and deploying hotfixes as needed.

---

### ## Summary of Changes & Benefits

1.  **Added "Hardening & Feedback" Phase:** This introduces a crucial 2-day buffer for integration testing and fixing bugs **before** the final deployment push, significantly improving launch quality.
2.  **Formalized User Testing:** We now have a dedicated UAT step for internal and trusted external users. This ensures the product works as expected in the real world.
3.  **Planned for "Day 8":** The new "Post-Launch" phase prepares the team for immediate monitoring and support, turning potential launch-day panic into a structured process.

This revised plan extends the timeline slightly but dramatically reduces risk, increases the quality of the product at launch, and prepares the team for success post-launch.
