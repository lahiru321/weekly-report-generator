"use client";

import { use, useState } from "react";
import { AlertTriangle, CheckCheck, Clock, FileText, ListChecks, MessageSquareWarning, Send, Timer } from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/state-message";
import { MetricCard } from "@/components/dashboard/metric-card";
import { managerReportLink, ReportTable } from "@/components/reports/report-table";
import { useApiData } from "@/hooks/use-api-data";
import { formatHours } from "@/lib/format";
import { reportsApi } from "@/lib/reports-api";
import { teamApi } from "@/lib/team-api";
import { cn } from "@/lib/utils";

/** Manager view of one team member: basic stats plus their full report history. */
export default function MemberProfilePage({ params }: PageProps<"/team/[userId]">) {
  const { userId: userIdParam } = use(params);
  const userId = Number(userIdParam);
  const [page, setPage] = useState(0);
  const profile = useApiData(() => teamApi.profile(userId), [userId]);
  const reports = useApiData(() => reportsApi.searchTeam({ userId, page, size: 10 }), [userId, page]);

  if (profile.error) return <ErrorState error={profile.error} onRetry={profile.reload} />;
  if (!profile.data) return <LoadingState />;

  const p = profile.data;
  const submittedCount = p.onTimeSubmissions + p.lateSubmissions;

  return (
    <RequireRole roles={["MANAGER", "ADMIN"]}>
      <PageHeader
        title={p.user.fullName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{p.user.email}</span>
            {!p.user.active && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">Deactivated</span>}
            {p.projects.map((project) => (
              <span key={project} className="rounded-full border px-2 py-0.5 text-xs">
                {project}
              </span>
            ))}
          </span>
        }
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total reports" icon={FileText} value={p.totalReports} hint={`${p.drafts} still in draft`} />
          <MetricCard label="Approved" icon={CheckCheck} value={p.approved} />
          <MetricCard label="Awaiting review" icon={Send} value={p.awaitingReview} />
          <MetricCard
            label="Needs correction"
            icon={MessageSquareWarning}
            tone={p.needsCorrection > 0 ? "warning" : "default"}
            value={p.needsCorrection}
          />
          <MetricCard
            label="On-time submissions"
            icon={Clock}
            value={submittedCount === 0 ? "—" : `${Math.round((p.onTimeSubmissions / submittedCount) * 100)}%`}
            hint={`${p.onTimeSubmissions} on time · ${p.lateSubmissions} late`}
          />
          <MetricCard label="Avg. tasks completed / week" icon={ListChecks} value={p.averageCompletedTasks} />
          <MetricCard label="Hours logged" icon={Timer} value={formatHours(p.totalHoursLogged)} hint="Across submitted reports" />
          <MetricCard
            label="Blockers in latest report"
            icon={AlertTriangle}
            tone={p.blockersInLatestReport > 0 ? "warning" : "default"}
            value={p.blockersInLatestReport}
          />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Report history</h2>
          {reports.error ? (
            <ErrorState error={reports.error} onRetry={reports.reload} />
          ) : !reports.data ? (
            <LoadingState />
          ) : reports.data.content.length === 0 ? (
            <EmptyState title="No reports yet" />
          ) : (
            <div className={cn("transition-opacity", reports.loading && "opacity-60")}>
              <ReportTable reports={reports.data.content} linkFor={managerReportLink} />
              <Pagination page={reports.data.page} totalPages={reports.data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </RequireRole>
  );
}
