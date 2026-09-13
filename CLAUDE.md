# CLAUDE.md — Weekly Report Generator & Team Dashboard

## What this is
A technical assessment for a full-stack developer job (started 2026-09-13, about 3–4 days to finish).
It's a multi-user app. Team members write fixed-format weekly reports, managers review them (approve or request changes), and managers get a team dashboard with charts.

**Live coding round follows.** The candidate must be able to explain and change every file. So:
- Keep code simple, boring, and consistent. No clever abstractions.
- Prefer clear names over comments. Add a short comment only where the reason isn't obvious.
- Don't add dependencies without a clear reason.

## Stack
- **Frontend:** Next.js 16.3 (App Router, TypeScript, React 19), Tailwind 4, shadcn/ui, react-hook-form + zod, Recharts
  - Next 16 has breaking changes. Check `frontend/node_modules/next/dist/docs/` before using a Next API (see `frontend/AGENTS.md`).
- **Backend:** Spring Boot 4.1 (starters: `webmvc`, `flyway`, etc.), Java 17, Lombok, Spring Security (JWT in httpOnly cookie, BCrypt), Spring Data JPA, Bean Validation, Flyway
- **Database:** PostgreSQL (via `docker-compose.yml`)
- **Tests:** JUnit + MockMvc (RBAC tests are required)

## Repo layout (target)
```
/backend    Spring Boot API    controller → service → repository → entity / dto
/frontend   Next.js app        app/ (pages), components/ (reusable), lib/ (api client, types)
/docs       ER diagram, notes
docker-compose.yml
README.md
```

## Roles
- `MEMBER`: create, edit, and submit **own** reports only
- `MANAGER`: see all reports, approve or request changes, view the dashboard. **Can never edit report content.**
- `ADMIN`: manager rights plus user management (roles, remove users) and project CRUD

## Report status flow (core rule, keep it all in `ReportWorkflowService`)
```
DRAFT ──submit──> SUBMITTED ──approve──> APPROVED
                     └─request changes (comment required)──> NEEDS_CORRECTION ──edit + resubmit──> SUBMITTED
```
- Member can edit only in `DRAFT` or `NEEDS_CORRECTION`.
- Manager can act only on `SUBMITTED`.
- **On every submit:** save a JSON snapshot to `report_versions` (version_no, submitted_at).
- **On every review action:** insert into `review_actions`, linked to the version it was made against.
- "Not started" = no report row exists for that user and week. "Late" = not submitted by the deadline after week end.

## Database tables
- `users` (role), `projects`, `project_members`
- `reports`: user, project, week_start, week_end, status, current_version, notes, links. **Unique (user_id, week_start)**
- `report_tasks`: name, priority, planned_pct, actual_pct, status, planned_hours, spent_hours, output
- `report_next_tasks`, `report_blockers` (is_key_issue), `report_achievements` (is_key_achievement)
- `report_hours`: type (DEVELOPMENT / TESTING / MEETINGS / DOCUMENTATION), hours
- `report_versions`: content_json snapshot
- `review_actions`: reviewer, action, comment, version_id, created_at

The report form is **fixed**: same fields, same order, for everyone. No custom fields.

## API rules
- REST, JSON, all under `/api`.
- Validate every request DTO with Bean Validation. Return clear 400 errors.
- **RBAC:** a member must never get another member's report or any `/api/manager/**`, `/api/dashboard/**`, `/api/admin/**` endpoint (403). Check ownership in the service layer, not just by URL.
- Every list endpoint for reports must support pagination and filters.

Main endpoints:
- Auth: `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- Member: `GET /api/reports/me`, `POST /api/reports`, `PUT /api/reports/{id}`, `POST /api/reports/{id}/submit`, `GET /api/reports/{id}`, `GET /api/reports/{id}/versions`
- Manager: `GET /api/manager/reports?week=&userId=&projectId=&status=&from=&to=&page=`, `POST /api/manager/reports/{id}/approve`, `POST /api/manager/reports/{id}/request-changes`
- Dashboard: `GET /api/dashboard/summary?week=`, `GET /api/dashboard/charts?from=&to=`
- Projects: `/api/projects` (CRUD) · Admin: `/api/admin/users`

## Pages (8 planned, at least 7 required)
1. Login / Register
2. My Report (create / edit)
3. Report History (member)
4. Report Detail (read-only, shared by both roles; show the manager comment banner when NEEDS_CORRECTION)
5. Manager Review (report + past versions + comment history + Approve / Request Changes)
6. Team Dashboard (filters, per-member status table incl. "not started", metric cards, charts, activity feed)
7. Projects management (full page with CRUD)
8. User management (admin) + Member Profile (history + basic stats)

UI: responsive, reusable components (StatusBadge, ReportForm, TaskTable, FilterBar, MetricCard, ChartCard), client-side validation, loading/empty/error states.

## Seed data
1 manager/admin, 5 members, 4 projects (e.g. Client A, Internal Tooling, R&D, Marketing), 6 weeks of reports in mixed statuses, including some late, some missing, and at least one with multiple versions and review comments.

## Build order
1. **Day 1:** project setup, Docker Postgres, Flyway schema, auth + JWT, seed data, login/register, role-based layout
2. **Day 2:** report API + workflow service + versions, member pages (form, history, detail)
3. **Day 3:** manager API, review page, dashboard + charts, projects, users, member profile
4. **Day 4:** RBAC tests, responsive polish, README, ER diagram, slides, demo video, submit

**Extras, only if time is left (in this order):** section side-by-side view → AI team summary / chat (Claude API, backend only, never expose the key) → deployment (Vercel + Render/Railway + Neon).

**Never skip:** review cycle, version history, RBAC + test, seed data, README, ER diagram, slides, video.

## Commands
- DB: `docker compose up -d` → Postgres on **localhost:5433** (5432 is taken by a local Windows PostgreSQL)
- Backend: `cd backend && ./mvnw spring-boot:run` → **http://localhost:8081** (8080 is taken by Apache/httpd)
- Backend tests: `cd backend && ./mvnw test` (no database needed)
- Frontend: `cd frontend && npm install && npm run dev` → http://localhost:3000 (proxies `/api` to 8081)
- Reset demo data: `docker compose down -v && docker compose up -d`, then restart the backend
- Demo logins: admin@demo.com, manager@demo.com, ava/ben/chloe/dev/emma@demo.com, password `Password123!`
- Frontend checks: `cd frontend && npx next typegen && npx tsc --noEmit && npm run lint`

## Working style for this repo
- Build in small, working steps. Each step should run before moving on.
- After each feature, briefly explain what was built and which files changed, so the candidate understands it.
- User prefers short, point-wise, ADHD-friendly explanations.
