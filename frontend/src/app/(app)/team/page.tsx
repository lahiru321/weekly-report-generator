"use client";

import { useState } from "react";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/state-message";
import { NativeSelect } from "@/components/forms/native-select";
import { managerReportLink, ReportTable } from "@/components/reports/report-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiData } from "@/hooks/use-api-data";
import { REPORT_STATUS_LABELS, REPORT_STATUSES } from "@/lib/labels";
import { projectsApi } from "@/lib/projects-api";
import { reportsApi, type TeamReportsQuery } from "@/lib/reports-api";
import { teamApi } from "@/lib/team-api";
import type { ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TeamReportsPage() {
  const [filters, setFilters] = useState<TeamReportsQuery>({});
  const [page, setPage] = useState(0);
  const members = useApiData(() => teamApi.members(), []);
  const projects = useApiData(() => projectsApi.list(), []);
  const reports = useApiData(() => reportsApi.searchTeam({ ...filters, page, size: 15 }), [filters, page]);

  function updateFilters(patch: Partial<TeamReportsQuery>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(0);
  }

  const hasFilters = Object.values(filters).some((value) => value !== undefined && value !== "");

  return (
    <RequireRole roles={["MANAGER", "ADMIN"]}>
      <PageHeader title="Team reports" description="Browse and filter every submitted report across the team." />

      <div className="mb-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1.5">
          <Label htmlFor="filter-member">Team member</Label>
          <NativeSelect
            id="filter-member"
            value={filters.userId ?? ""}
            onChange={(event) => updateFilters({ userId: event.target.value ? Number(event.target.value) : undefined })}
          >
            <option value="">All members</option>
            {members.data?.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-project">Project</Label>
          <NativeSelect
            id="filter-project"
            value={filters.projectId ?? ""}
            onChange={(event) =>
              updateFilters({ projectId: event.target.value ? Number(event.target.value) : undefined })
            }
          >
            <option value="">All projects</option>
            {projects.data?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-status">Status</Label>
          <NativeSelect
            id="filter-status"
            value={filters.status ?? ""}
            onChange={(event) => updateFilters({ status: (event.target.value || undefined) as ReportStatus | undefined })}
          >
            <option value="">All statuses</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {REPORT_STATUS_LABELS[status]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-week">Week (any day)</Label>
          <Input
            id="filter-week"
            type="date"
            value={filters.week ?? ""}
            onChange={(event) => updateFilters({ week: event.target.value || undefined })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-from">From</Label>
          <Input
            id="filter-from"
            type="date"
            disabled={!!filters.week}
            value={filters.from ?? ""}
            onChange={(event) => updateFilters({ from: event.target.value || undefined })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-to">To</Label>
          <Input
            id="filter-to"
            type="date"
            disabled={!!filters.week}
            value={filters.to ?? ""}
            onChange={(event) => updateFilters({ to: event.target.value || undefined })}
          />
        </div>
        {hasFilters && (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-6">
            <Button variant="ghost" size="sm" onClick={() => updateFilters({ userId: undefined, projectId: undefined, status: undefined, week: undefined, from: undefined, to: undefined })}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {reports.error ? (
        <ErrorState error={reports.error} onRetry={reports.reload} />
      ) : !reports.data ? (
        <LoadingState />
      ) : reports.data.content.length === 0 ? (
        <EmptyState title="No reports match these filters" />
      ) : (
        <div className={cn("transition-opacity", reports.loading && "opacity-60")}>
          <p className="mb-2 text-sm text-muted-foreground">{reports.data.totalElements} reports</p>
          <ReportTable reports={reports.data.content} showMember linkFor={managerReportLink} />
          <Pagination page={reports.data.page} totalPages={reports.data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </RequireRole>
  );
}
