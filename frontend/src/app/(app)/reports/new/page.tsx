"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, LoadingState } from "@/components/common/state-message";
import { WeekPicker } from "@/components/common/week-picker";
import { ReportForm } from "@/components/reports/report-form";
import { StatusBadge } from "@/components/reports/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";
import { ApiError } from "@/lib/api";
import { currentWeekStart, formatDateTime, formatWeek, weekStartOf } from "@/lib/format";
import { projectsApi } from "@/lib/projects-api";
import { reportsApi } from "@/lib/reports-api";

/**
 * "My Report": pick a week, then either start a new report or open the one that already exists.
 * The selected week lives in the URL (/reports/new?week=2026-09-01) so the page can be linked to.
 */
export default function NewReportPage({ searchParams }: PageProps<"/reports/new">) {
  const { week } = use(searchParams);
  const router = useRouter();
  const thisWeek = currentWeekStart();
  const requestedWeek = typeof week === "string" && week ? weekStartOf(week) : thisWeek;
  // Reports can't be created for future weeks (the API rejects them too)
  const weekStart = requestedWeek > thisWeek ? thisWeek : requestedWeek;

  const projects = useApiData(() => projectsApi.list(), []);
  const existing = useApiData(
    () =>
      reportsApi.getMineForWeek(weekStart).catch((error) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }),
    [weekStart],
  );

  function changeWeek(newWeekStart: string) {
    router.replace(`/reports/new?week=${newWeekStart}`, { scroll: false });
  }

  const error = projects.error ?? existing.error;

  return (
    <RequireRole roles={["MEMBER"]}>
      <PageHeader
        title="My weekly report"
        description="Pick a week. Each week has one report, which you can save as a draft and submit for review."
      />

      <div className="mb-6">
        <WeekPicker value={weekStart} onChange={changeWeek} />
      </div>

      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            projects.reload();
            existing.reload();
          }}
        />
      ) : projects.loading || existing.loading ? (
        <LoadingState />
      ) : existing.data ? (
        <Card>
          <CardHeader>
            <CardTitle>You already have a report for this week</CardTitle>
            <CardDescription>
              <span className="flex flex-wrap items-center gap-2">
                {formatWeek(existing.data.weekStart, existing.data.weekEnd)}
                <StatusBadge status={existing.data.status} />
                <span>Last updated {formatDateTime(existing.data.updatedAt)}</span>
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {existing.data.permissions.canEdit && (
              <Link href={`/reports/${existing.data.id}/edit`} className={buttonVariants()}>
                <Pencil />
                {existing.data.status === "NEEDS_CORRECTION" ? "Fix and resubmit" : "Continue editing"}
              </Link>
            )}
            <Link
              href={`/reports/${existing.data.id}`}
              className={buttonVariants({ variant: existing.data.permissions.canEdit ? "outline" : "default" })}
            >
              <Eye />
              View report
            </Link>
          </CardContent>
        </Card>
      ) : (
        // key resets the form when the week changes
        <ReportForm key={weekStart} defaultWeekStart={weekStart} projects={projects.data ?? []} lockWeek />
      )}
    </RequireRole>
  );
}
