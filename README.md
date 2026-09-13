# Weekly Report Generator & Team Dashboard

A full-stack app where team members submit structured weekly reports, managers review them (approve or send back for correction), and managers get a team dashboard with charts.

**Stack:** Next.js 16 (React 19, TypeScript, Tailwind, shadcn/ui, Recharts) · Spring Boot 4 (Java 17, Spring Security, JPA, Flyway) · PostgreSQL 16

---

## Setup

### Prerequisites

- Java 17+
- Node.js 20+
- Docker Desktop (for PostgreSQL)

Maven is not needed; the backend includes the Maven wrapper (`mvnw`).

### 1. Install dependencies

```bash
cd frontend
npm install
```

The backend downloads its dependencies automatically on first run.

### 2. Run the database

From the project root:

```bash
docker compose up -d
```

PostgreSQL runs on **localhost:5433** (not 5432, to avoid clashing with a locally installed PostgreSQL).
Database `weekly_report`, user `weekly`, password `weekly`.

### 3. Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows use `mvnw.cmd spring-boot:run`.

- API: **http://localhost:8081/api**
- On startup, Flyway creates the schema and the app seeds demo data if the database is empty.

### 4. Run the frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000**. Next.js forwards `/api/*` to the backend, so the browser talks to one origin.

### Demo accounts

All passwords: `Password123!`

| Role | Email |
|---|---|
| Admin | admin@demo.com |
| Manager | manager@demo.com |
| Team members | ava@demo.com, ben@demo.com, chloe@demo.com, dev@demo.com, emma@demo.com |

The seed covers 6 weeks with every status: approved, submitted, needs correction, drafts, late submissions, missing weeks, and reports that went through a full correction cycle with multiple versions.

**Reset demo data:** `docker compose down -v && docker compose up -d`, then restart the backend.

### Run the tests

```bash
cd backend
./mvnw test
```

The tests don't need a database. They cover role-based access control:
- `RoleBasedAccessTest` runs the real security config and JWT filter against the controllers.
- `ReportAccessPolicyTest` checks the report ownership and editing rules.

### Configuration

| Variable | Default | Used by |
|---|---|---|
| `DB_URL` / `DB_USER` / `DB_PASSWORD` | local Docker database | backend |
| `PORT` | `8081` | backend |
| `JWT_SECRET` | dev-only value, **change in production** (32+ chars) | backend |
| `COOKIE_SECURE` | `false` (set `true` behind HTTPS) | backend |
| `SEED_ENABLED` | `true` | backend |
| `BACKEND_URL` | `http://localhost:8081` | frontend |

---

## Features

**Team members**
- Fixed weekly report form, identical for everyone:
  - Week and project
  - Task table (priority, planned vs actual %, status, planned vs spent hours, output)
  - Next week's plans
  - Blockers and achievements, each with a "key" flag
  - Hours by task type
  - Notes and links
- Save as draft, submit, see the manager's comment, correct and resubmit
- Report history with statuses

**Managers**
- Dashboard for any week:
  - Submitted count and compliance (on time / late / pending)
  - Needs correction and open blockers
  - Status per member, including "not started"
  - Side-by-side view of one section (blockers, achievements, plans) across the team
  - Charts: tasks completed trend, status by member, workload by project, time by task type
  - Recent activity feed
- Team reports list with filters: member, project, status, week, date range
- Review page: Approve, or Request Changes with a comment. Shows all past versions and the comments made on each.
- Member profile page with stats and full report history
- Project management (list, add, edit, delete, assign members)

**Admins**
- Everything a manager can do
- User management: add users, change roles, deactivate/reactivate

### Pages

| Page | Route | Role |
|---|---|---|
| Login / Register | `/login`, `/register` | everyone |
| My weekly report (create/edit) | `/reports/new`, `/reports/[id]/edit` | member |
| Report history | `/reports` | member |
| Report detail (read-only) | `/reports/[id]` | member (own), manager |
| Manager review | `/review/[id]` | manager |
| Team dashboard | `/dashboard` | manager |
| Team reports | `/team` | manager |
| Team member profile | `/team/[userId]` | manager |
| Projects | `/projects` | manager |
| User management | `/admin/users` | admin |

---

## How it works

### Review workflow

```
DRAFT ──submit──> SUBMITTED ──approve──> APPROVED
                     └──request changes (comment required)──> NEEDS_CORRECTION ──edit + resubmit──> SUBMITTED
```

- All status changes go through `ReportWorkflowService`.
- Members can edit only in `DRAFT` or `NEEDS_CORRECTION`. Managers can act only on `SUBMITTED`.
- Every submit saves a JSON snapshot in `report_versions`, so old versions are never overwritten.
- Every review decision is stored in `review_actions`, linked to the version it was made on.

### Role-based access

- Login sets a JWT in an **httpOnly cookie**. `JwtAuthFilter` reads it on every request and reloads the user, so role changes and deactivation apply immediately.
- **URL rules** (`SecurityConfig`): `/api/manager/**` and `/api/dashboard/**` require MANAGER/ADMIN, and `/api/admin/**` requires ADMIN.
- **Method rules:** `@PreAuthorize("hasRole('MEMBER')")` on create/edit/submit, so managers can't rewrite report content.
- **Ownership rules** (`ReportAccessPolicy`): members only reach their own reports, and drafts stay private even from managers.
- Report lists always take the user id from the login, never from the request.

### Project structure

```
backend/src/main/java/com/weeklyreport
  auth/        login, register, logout, current user
  security/    JWT service, cookie, auth filter
  config/      SecurityConfig
  report/      entities, workflow, access policy, controllers, DTOs
  dashboard/   summary, team status, charts, activity, sections
  team/        member list and profile (manager)
  project/     project CRUD
  admin/       user management
  seed/        demo data
  common/      errors, pagination, week helpers
backend/src/main/resources/db/migration   Flyway SQL schema

frontend/src
  app/(auth)   login, register
  app/(app)    pages behind login (reports, review, dashboard, team, projects, admin)
  components/  reports/, dashboard/, forms/, common/, layout/, ui/ (shadcn)
  lib/         API clients, types, labels, formatting
  hooks/       useApiData
  proxy.ts     redirects to /login when there is no session cookie
```

See [docs/er-diagram.md](docs/er-diagram.md) for the database design.

---

## Future improvements

- Optimistic locking so two managers can't review the same report at the same moment
- Email or in-app notifications when a report is sent back or approved
- SQL-level aggregation for the dashboard at larger team sizes
- AI assistant for weekly team summaries
- Reminder emails before the weekly deadline
