# Phased Delivery Plan

You picked "all of the above". I'll deliver in 3 phases so you can review between each. This plan covers all three; I'll start Phase 1 immediately after you approve.

---

## Phase 1 — QA & fix the 4 modules end-to-end

Goal: every signed-in user can use DigiGuide, DigiLab, DigiChat, DigiBlog without dead ends.

**Auth & onboarding**
- Verify signup → email auto-confirm → onboarding → dashboard works.
- Make Google login gracefully fail in preview (known proxy loop) with a clear toast pointing to email login.
- Fix any redirect bugs surfaced during walk-through.

**DigiGuide**
- Verify Career list, Dream Simulator, "For You" recommendations all load.
- Seed any missing career rows if the catalog is thin.

**DigiLab**
- The `learning_resources` table is likely empty (UI shows "no resources"). Seed ~20 CBC-aligned sample resources across grades/subjects/types so the page is usable.
- Verify search + type filter.

**DigiChat**
- Seed 3–4 public squads (Form 4 KCSE, CBC Grade 8, Career Talk, Coding Club) so new users have somewhere to join.
- Verify join, send message, realtime delivery, flagging.

**DigiBlog**
- Seed 4–6 starter posts across categories so the feed isn't empty.
- Verify create-post, like, comment.

**Other pages**
- Smoke-check Academic Tracker (CRUD + export) and Study Planner (create block, dashboard widget, browser notification permission).

Deliverable: a short report listing each module's status + fixes applied.

---

## Phase 2 — School Management System integration (CSV import)

Goal: a school admin can upload a CSV/XLSX and have students + grades land in the database.

- New page `/admin/import` (admin role only).
- Two upload flows:
  1. **Students CSV** → creates `profiles` rows (display_name, grade, education_level, school, county). Does NOT create auth users (privacy/KDPA); instead generates invite tokens stored in a new `school_invites` table that students redeem at signup.
  2. **Grades CSV** → bulk-inserts into `academic_records` matched by student email or admission number.
- Edge function `school-import` validates rows, returns per-row success/error report.
- Sample CSV templates downloadable from the page.
- Generic NEMIS-compatible column mapping (Adm No, Name, Class, Subject, Grade, Term, Year).

---

## Phase 3 — Public REST API for third-party integrations

Goal: external systems can read/write with an API key.

- New table `api_keys` (hashed key, owner_user_id, scopes, last_used_at, revoked).
- Settings page section to generate / revoke keys (shown once).
- Edge function `public-api` exposing:
  - `GET  /v1/profile` — read caller's profile
  - `GET  /v1/academic-records` — list records
  - `POST /v1/academic-records` — insert grade
  - `GET  /v1/careers` — list careers
  - `GET  /v1/resources` — list learning resources
- Auth: `Authorization: Bearer <api_key>`; key hashed with SHA-256, scopes enforced per route, basic in-memory rate limit (60 req/min per key).
- Auto-generated docs page at `/api-docs` with curl examples.

---

## Technical notes

- All seeded data is realistic Kenyan CBC content (no Lorem ipsum).
- Roles: import + API-key management gated by `has_role(uid, 'admin')`.
- Edge functions use the existing CORS + JWT-validation pattern, with Zod input validation.
- API keys stored hashed (never plaintext) — shown to user once on creation.
- New tables get full RLS (owner-only read, admin manage).

---

## Order of execution

1. ✅ Approve plan
2. Phase 1 (this loop)
3. Phase 2 (next message from you: "go phase 2")
4. Phase 3 (next message from you: "go phase 3")

Reply **approve** to start Phase 1, or tell me what to change.
