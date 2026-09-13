"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, LoadingState } from "@/components/common/state-message";
import { ReportForm } from "@/components/reports/report-form";
import { useApiData } from "@/hooks/use-api-data";
import { ApiError } from "@/lib/api";
import { currentWeekStart, formatWeek, weekStartOf } from "@/lib/format";
import { projectsApi } from "@/lib/projects-api";
import { reportsApi } from "@/lib/reports-api";

/**
 * "My Report": opens this week's report if it already exists, otherwise shows an empty form.
 * /reports/new?week=2026-09-01 does the same for another week.
 */
export default function NewReportPage({ searchParams }: PageProps<"/reports/new">) {
  const { week } = use(searchParams);
  const weekStart = typeof week === "string" && week ? weekStartOf(week) : currentWeekStart();
  const router = useRouter();

  const projects = useApiData(() => projectsApi.list(), []);
  const existing = useApiData(
    () =>
      reportsApi.getMineForWeek(weekStart).catch((error) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }),
    [weekStart],
  );

  useEffect(() => {
    if (existing.data) {
      const { id, permissions } = existing.data;
      router.replace(permissions.canEdit ? `/reports/${id}/edit` : `/reports/${id}`);
    }
  }, [existing.data, router]);

  const error = projects.error ?? existing.error;

  return (
    <RequireRole roles={["MEMBER"]}>
      <PageHeader
        title="New weekly report"
        description={`Week of ${formatWeek(weekStart)}. Save a draft anytime, then submit it for review.`}
      />
      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            projects.reload();
            existing.reload();
          }}
        />
      ) : projects.loading || existing.loading || existing.data ? (
        <LoadingState />
      ) : (
        <ReportForm defaultWeekStart={weekStart} projects={projects.data ?? []} />
      )}
    </RequireRole>
  );
}
