"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, LoadingState } from "@/components/common/state-message";
import { ReportView } from "@/components/reports/report-view";
import { ReviewBanner } from "@/components/reports/review-banner";
import { ReviewHistory } from "@/components/reports/review-history";
import { StatusBadge } from "@/components/reports/status-badge";
import { VersionHistory } from "@/components/reports/version-history";
import { Button, buttonVariants } from "@/components/ui/button";
import { useApiData } from "@/hooks/use-api-data";
import { formatDateTime, formatWeek } from "@/lib/format";
import { reportsApi } from "@/lib/reports-api";

/** Read-only report page, shared by team members (own reports) and managers. */
export default function ReportDetailPage({ params }: PageProps<"/reports/[id]">) {
  const { id } = use(params);
  const reportId = Number(id);
  const { user } = useAuth();
  const report = useApiData(() => reportsApi.get(reportId), [reportId]);
  const [submitting, setSubmitting] = useState(false);

  if (report.error) return <ErrorState error={report.error} onRetry={report.reload} />;
  if (!report.data) return <LoadingState />;

  const detail = report.data;
  const isOwner = user?.id === detail.userId;
  const { canEdit, canSubmit, canReview } = detail.permissions;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await reportsApi.submit(detail.id);
      toast.success("Report submitted for review");
      report.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit the report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isOwner ? "My weekly report" : `${detail.userName}'s weekly report`}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatWeek(detail.weekStart, detail.weekEnd)}</span>
            <StatusBadge status={detail.status} />
            {detail.currentVersion > 0 && <span>Version {detail.currentVersion}</span>}
            {detail.submittedAt && <span>Last submitted {formatDateTime(detail.submittedAt)}</span>}
          </span>
        }
        actions={
          (canEdit || canSubmit || canReview) && (
            <>
              {canEdit && (
                <Link href={`/reports/${detail.id}/edit`} className={buttonVariants({ variant: "outline" })}>
                  <Pencil />
                  Edit
                </Link>
              )}
              {canSubmit && (
                <Button onClick={handleSubmit} disabled={submitting}>
                  <Send />
                  {submitting ? "Submitting..." : detail.status === "NEEDS_CORRECTION" ? "Resubmit" : "Submit for review"}
                </Button>
              )}
              {canReview && (
                <Link href={`/review/${detail.id}`} className={buttonVariants()}>
                  <ClipboardCheck />
                  Review
                </Link>
              )}
            </>
          )
        }
      />

      {detail.latestReview && detail.status !== "SUBMITTED" && <ReviewBanner review={detail.latestReview} />}

      <ReportView content={detail.content} />
      <ReviewHistory reviews={detail.reviewHistory} />
      {detail.currentVersion > 0 && <VersionHistory reportId={detail.id} currentVersion={detail.currentVersion} />}
    </div>
  );
}
