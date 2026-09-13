"use client";

import { use } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/state-message";
import { ReportForm } from "@/components/reports/report-form";
import { ReviewBanner } from "@/components/reports/review-banner";
import { StatusBadge } from "@/components/reports/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { useApiData } from "@/hooks/use-api-data";
import { formatWeek } from "@/lib/format";
import { REPORT_STATUS_LABELS } from "@/lib/labels";
import { projectsApi } from "@/lib/projects-api";
import { reportsApi } from "@/lib/reports-api";

export default function EditReportPage({ params }: PageProps<"/reports/[id]/edit">) {
  const { id } = use(params);
  const reportId = Number(id);
  const report = useApiData(() => reportsApi.get(reportId), [reportId]);
  const projects = useApiData(() => projectsApi.list(), []);

  const error = report.error ?? projects.error;
  if (error) return <ErrorState error={error} onRetry={report.reload} />;
  if (!report.data || !projects.data) return <LoadingState />;

  const detail = report.data;
  const viewLink = (
    <Link href={`/reports/${detail.id}`} className={buttonVariants({ variant: "outline" })}>
      View report
    </Link>
  );

  if (!detail.permissions.canEdit) {
    return (
      <EmptyState
        title="This report can't be edited"
        description={`It is currently ${REPORT_STATUS_LABELS[detail.status]}. Reports can only be edited as a Draft or when changes are requested.`}
        action={viewLink}
      />
    );
  }

  return (
    <RequireRole roles={["MEMBER"]}>
      <PageHeader
        title="Edit weekly report"
        description={
          <span className="flex flex-wrap items-center gap-2">
            {formatWeek(detail.weekStart, detail.weekEnd)}
            <StatusBadge status={detail.status} />
          </span>
        }
        actions={viewLink}
      />
      {detail.status === "NEEDS_CORRECTION" && detail.latestReview && (
        <div className="mb-6">
          <ReviewBanner review={detail.latestReview} />
        </div>
      )}
      <ReportForm report={detail} defaultWeekStart={detail.weekStart} projects={projects.data} />
    </RequireRole>
  );
}
