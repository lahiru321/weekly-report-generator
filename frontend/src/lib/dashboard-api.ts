import { api } from "./api";
import type { ActivityItem, DashboardCharts, DashboardSummary, MemberWeekStatus, ReportSection, SectionEntry } from "./types";

export const dashboardApi = {
  summary: (week?: string) => api<DashboardSummary>("/dashboard/summary", { query: { week } }),
  teamStatus: (week?: string) => api<MemberWeekStatus[]>("/dashboard/team-status", { query: { week } }),
  charts: (weeks = 8) => api<DashboardCharts>("/dashboard/charts", { query: { weeks } }),
  activity: (limit = 15) => api<ActivityItem[]>("/dashboard/activity", { query: { limit } }),
  section: (section: ReportSection, week?: string) =>
    api<SectionEntry[]>("/dashboard/sections", { query: { section, week } }),
};
