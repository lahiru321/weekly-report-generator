import { api } from "./api";
import type { Page, ReportDetail, ReportRequest, ReportStatus, ReportSummary, ReportVersion } from "./types";

export type MyReportsQuery = {
  status?: ReportStatus;
  page?: number;
  size?: number;
};

export type TeamReportsQuery = {
  week?: string;
  userId?: number;
  projectId?: number;
  status?: ReportStatus;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
};

export const reportsApi = {
  // Team member
  listMine: (query: MyReportsQuery = {}) => api<Page<ReportSummary>>("/reports/me", { query }),
  getMineForWeek: (date: string) => api<ReportDetail>("/reports/me/week", { query: { date } }),
  get: (id: number) => api<ReportDetail>(`/reports/${id}`),
  versions: (id: number) => api<ReportVersion[]>(`/reports/${id}/versions`),
  create: (body: ReportRequest) => api<ReportDetail>("/reports", { method: "POST", body }),
  update: (id: number, body: ReportRequest) => api<ReportDetail>(`/reports/${id}`, { method: "PUT", body }),
  submit: (id: number) => api<ReportDetail>(`/reports/${id}/submit`, { method: "POST" }),

  // Manager
  searchTeam: (query: TeamReportsQuery = {}) => api<Page<ReportSummary>>("/manager/reports", { query }),
  approve: (id: number, comment?: string) =>
    api<ReportDetail>(`/manager/reports/${id}/approve`, { method: "POST", body: { comment } }),
  requestChanges: (id: number, comment: string) =>
    api<ReportDetail>(`/manager/reports/${id}/request-changes`, { method: "POST", body: { comment } }),
};
