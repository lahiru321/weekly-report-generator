import type { ReportStatus, TaskPriority, TaskStatus, TaskType } from "./types";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEEDS_CORRECTION: "Needs Correction",
  APPROVED: "Approved",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  DEVELOPMENT: "Development",
  TESTING: "Testing",
  MEETINGS: "Meetings",
  DOCUMENTATION: "Documentation",
  OTHER: "Other",
};

export const REPORT_STATUSES = Object.keys(REPORT_STATUS_LABELS) as ReportStatus[];
export const TASK_PRIORITIES = Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[];
export const TASK_STATUSES = Object.keys(TASK_STATUS_LABELS) as TaskStatus[];
export const TASK_TYPES = Object.keys(TASK_TYPE_LABELS) as TaskType[];
