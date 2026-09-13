# ER Diagram

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        varchar role "MEMBER | MANAGER | ADMIN"
        boolean active
        timestamptz created_at
    }
    PROJECTS {
        bigint id PK
        varchar name UK
        varchar description
        timestamptz created_at
    }
    PROJECT_MEMBERS {
        bigint project_id PK, FK
        bigint user_id PK, FK
    }
    REPORTS {
        bigint id PK
        bigint user_id FK
        bigint project_id FK "nullable"
        date week_start "unique with user_id"
        date week_end
        varchar status "DRAFT | SUBMITTED | NEEDS_CORRECTION | APPROVED"
        int current_version
        text notes
        text links
        timestamptz submitted_at
        timestamptz updated_at
    }
    REPORT_TASKS {
        bigint id PK
        bigint report_id FK
        int position
        varchar name
        varchar priority
        int planned_pct
        int actual_pct
        varchar status
        numeric planned_hours
        numeric spent_hours
        varchar output
    }
    REPORT_NEXT_TASKS {
        bigint id PK
        bigint report_id FK
        int position
        varchar description
    }
    REPORT_BLOCKERS {
        bigint id PK
        bigint report_id FK
        int position
        varchar description
        boolean is_key
    }
    REPORT_ACHIEVEMENTS {
        bigint id PK
        bigint report_id FK
        int position
        varchar description
        boolean is_key
    }
    REPORT_HOURS {
        bigint id PK
        bigint report_id FK
        varchar task_type "unique with report_id"
        numeric hours
    }
    REPORT_VERSIONS {
        bigint id PK
        bigint report_id FK
        int version_no "unique with report_id"
        jsonb content "frozen copy of the report"
        timestamptz submitted_at
    }
    REVIEW_ACTIONS {
        bigint id PK
        bigint report_id FK
        bigint version_id FK
        bigint reviewer_id FK
        varchar action "APPROVED | CHANGES_REQUESTED"
        text comment
        timestamptz created_at
    }

    USERS ||--o{ PROJECT_MEMBERS : "is member"
    PROJECTS ||--o{ PROJECT_MEMBERS : "has members"
    USERS ||--o{ REPORTS : "writes"
    PROJECTS |o--o{ REPORTS : "tags"
    REPORTS ||--o{ REPORT_TASKS : "tasks completed"
    REPORTS ||--o{ REPORT_NEXT_TASKS : "planned next week"
    REPORTS ||--o{ REPORT_BLOCKERS : "blockers"
    REPORTS ||--o{ REPORT_ACHIEVEMENTS : "achievements"
    REPORTS ||--o{ REPORT_HOURS : "hours by type"
    REPORTS ||--o{ REPORT_VERSIONS : "one per submit"
    REPORTS ||--o{ REVIEW_ACTIONS : "review history"
    REPORT_VERSIONS ||--o{ REVIEW_ACTIONS : "comment made on"
    USERS ||--o{ REVIEW_ACTIONS : "reviews"
```

## How to read it

- **Roles** are a column on `users` (one role per user, as the app needs).
- **`reports`** holds the current, editable report: one per user per week (`unique(user_id, week_start)`).
- The report's lists live in child tables (`report_tasks`, `report_blockers`, ...), so the structure is fixed and the dashboard can query it.
- **Version history:** every submit writes a JSON snapshot to `report_versions`. Editing after "Needs Correction" never overwrites an old version.
- **Review history:** every Approve / Request Changes decision is a row in `review_actions`, linked to the exact `version_id` it was made against.
- Current status and version number sit on `reports`; the latest comment is the newest `review_actions` row.
