export type Role = "MEMBER" | "MANAGER" | "ADMIN";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface ApiErrorBody {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
  timestamp: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ---- Projects ----

export interface Project {
  id: number;
  name: string;
  description: string | null;
  members: { id: number; fullName: string }[];
}

export interface ProjectRequest {
  name: string;
  description: string;
  memberIds: number[];
}

// ---- Reports ----

export type ReportStatus = "DRAFT" | "SUBMITTED" | "NEEDS_CORRECTION" | "APPROVED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
export type TaskType = "DEVELOPMENT" | "TESTING" | "MEETINGS" | "DOCUMENTATION" | "OTHER";
export type ReviewActionType = "APPROVED" | "CHANGES_REQUESTED";

export interface Task {
  name: string;
  priority: TaskPriority;
  plannedPct: number;
  actualPct: number;
  status: TaskStatus;
  plannedHours: number;
  spentHours: number;
  output: string | null;
}

export interface ReportItem {
  description: string;
  isKey: boolean;
}

/** The fixed report structure, identical for every user. */
export interface ReportContent {
  projectId: number | null;
  projectName: string | null;
  tasks: Task[];
  nextWeekTasks: string[];
  blockers: ReportItem[];
  achievements: ReportItem[];
  hoursByType: Partial<Record<TaskType, number>>;
  notes: string | null;
  links: string | null;
}

export interface ReportRequest {
  weekStart: string;
  projectId: number | null;
  tasks: Task[];
  nextWeekTasks: string[];
  blockers: ReportItem[];
  achievements: ReportItem[];
  hoursByType: Partial<Record<TaskType, number>>;
  notes: string;
  links: string;
}

export interface ReviewEntry {
  id: number;
  versionNo: number;
  reviewerId: number;
  reviewerName: string;
  action: ReviewActionType;
  comment: string | null;
  createdAt: string;
}

export interface ReportPermissions {
  canEdit: boolean;
  canSubmit: boolean;
  canReview: boolean;
}

export interface ReportSummary {
  id: number;
  userId: number;
  userName: string;
  projectId: number | null;
  projectName: string | null;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  currentVersion: number;
  taskCount: number;
  completedTaskCount: number;
  blockerCount: number;
  submittedAt: string | null;
  updatedAt: string;
}

export interface ReportDetail {
  id: number;
  userId: number;
  userName: string;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  currentVersion: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  content: ReportContent;
  latestReview: ReviewEntry | null;
  reviewHistory: ReviewEntry[];
  permissions: ReportPermissions;
}

export interface ReportVersion {
  id: number;
  versionNo: number;
  submittedAt: string;
  content: ReportContent;
  reviews: ReviewEntry[];
}

// ---- Dashboard ----

export interface DashboardSummary {
  weekStart: string;
  weekEnd: string;
  activeMembers: number;
  submitted: number;
  submittedOnTime: number;
  submittedLate: number;
  pending: number;
  overdue: number;
  complianceRate: number;
  needsCorrection: number;
  awaitingReview: number;
  openBlockers: number;
}

export interface MemberWeekStatus {
  userId: number;
  fullName: string;
  status: ReportStatus | "NOT_STARTED";
  /** null when there is no report or it is still a private draft */
  reportId: number | null;
  firstSubmittedAt: string | null;
  late: boolean;
  completedTasks: number;
  blockerCount: number;
}

export interface DashboardCharts {
  members: { id: number; fullName: string }[];
  tasksCompletedTrend: { weekStart: string; total: number; byMember: Record<string, number> }[];
  statusByMember: {
    userId: number;
    fullName: string;
    approved: number;
    submitted: number;
    needsCorrection: number;
    draft: number;
    missing: number;
  }[];
  workloadByProject: { projectName: string; reports: number; tasks: number; spentHours: number }[];
  timeByTaskType: { type: TaskType; hours: number }[];
}

export type ActivityType = "SUBMITTED" | "RESUBMITTED" | "APPROVED" | "CHANGES_REQUESTED";

export interface ActivityItem {
  type: ActivityType;
  reportId: number;
  memberName: string;
  weekStart: string;
  versionNo: number;
  actorName: string;
  comment: string | null;
  at: string;
}

export type ReportSection = "BLOCKERS" | "ACHIEVEMENTS" | "NEXT_WEEK";

export interface SectionEntry {
  reportId: number;
  userId: number;
  fullName: string;
  status: ReportStatus;
  items: ReportItem[];
}

// ---- Team & admin ----

export interface MemberProfile {
  user: User;
  projects: string[];
  totalReports: number;
  approved: number;
  awaitingReview: number;
  needsCorrection: number;
  drafts: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  averageCompletedTasks: number;
  totalHoursLogged: number;
  blockersInLatestReport: number;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  role: Role;
  password: string;
}

// ---- AI assistant ----

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiReply {
  text: string;
  generatedAt: string;
}

export interface AiStatus {
  enabled: boolean;
}
