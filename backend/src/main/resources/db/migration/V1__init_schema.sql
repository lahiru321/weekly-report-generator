-- Users & roles
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('MEMBER', 'MANAGER', 'ADMIN')),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Projects / categories
CREATE TABLE projects (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE project_members (
    project_id BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

-- One report per user per week
CREATE TABLE reports (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users (id),
    project_id      BIGINT      REFERENCES projects (id) ON DELETE SET NULL,
    week_start      DATE        NOT NULL,
    week_end        DATE        NOT NULL,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED')),
    current_version INT         NOT NULL DEFAULT 0,
    notes           TEXT,
    links           TEXT,
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reports_user_week UNIQUE (user_id, week_start),
    CONSTRAINT ck_reports_week_range CHECK (week_end >= week_start)
);

CREATE INDEX idx_reports_week_start ON reports (week_start);
CREATE INDEX idx_reports_status ON reports (status);

-- Report content (the current, editable version)
CREATE TABLE report_tasks (
    id            BIGSERIAL PRIMARY KEY,
    report_id     BIGINT       NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
    position      INT          NOT NULL,
    name          VARCHAR(200) NOT NULL,
    priority      VARCHAR(10)  NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    planned_pct   INT          NOT NULL CHECK (planned_pct BETWEEN 0 AND 100),
    actual_pct    INT          NOT NULL CHECK (actual_pct BETWEEN 0 AND 100),
    status        VARCHAR(20)  NOT NULL CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    planned_hours NUMERIC(5, 2) NOT NULL CHECK (planned_hours >= 0),
    spent_hours   NUMERIC(5, 2) NOT NULL CHECK (spent_hours >= 0),
    output        VARCHAR(500)
);

CREATE TABLE report_next_tasks (
    id          BIGSERIAL PRIMARY KEY,
    report_id   BIGINT       NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
    position    INT          NOT NULL,
    description VARCHAR(500) NOT NULL
);

CREATE TABLE report_blockers (
    id          BIGSERIAL PRIMARY KEY,
    report_id   BIGINT       NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
    position    INT          NOT NULL,
    description VARCHAR(500) NOT NULL,
    is_key      BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE report_achievements (
    id          BIGSERIAL PRIMARY KEY,
    report_id   BIGINT       NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
    position    INT          NOT NULL,
    description VARCHAR(500) NOT NULL,
    is_key      BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE report_hours (
    id        BIGSERIAL PRIMARY KEY,
    report_id BIGINT        NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
    task_type VARCHAR(20)   NOT NULL CHECK (task_type IN ('DEVELOPMENT', 'TESTING', 'MEETINGS', 'DOCUMENTATION', 'OTHER')),
    hours     NUMERIC(5, 2) NOT NULL CHECK (hours >= 0),
    CONSTRAINT uq_report_hours_type UNIQUE (report_id, task_type)
);

-- Snapshot of the report content taken on every submit
CREATE TABLE report_versions (
    id           BIGSERIAL PRIMARY KEY,
    report_id    BIGINT      NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
    version_no   INT         NOT NULL,
    content      JSONB       NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_report_versions_no UNIQUE (report_id, version_no)
);

-- Every manager decision, linked to the version it was made against
CREATE TABLE review_actions (
    id          BIGSERIAL PRIMARY KEY,
    report_id   BIGINT      NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
    version_id  BIGINT      NOT NULL REFERENCES report_versions (id) ON DELETE CASCADE,
    reviewer_id BIGINT      NOT NULL REFERENCES users (id),
    action      VARCHAR(30) NOT NULL CHECK (action IN ('APPROVED', 'CHANGES_REQUESTED')),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_review_comment_required CHECK (action = 'APPROVED' OR comment IS NOT NULL)
);

CREATE INDEX idx_review_actions_report ON review_actions (report_id);
CREATE INDEX idx_review_actions_created ON review_actions (created_at DESC);
