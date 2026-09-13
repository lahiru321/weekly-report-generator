"use client";

import { use, useState } from "react";
import Link from "next/link";
import { CircleCheck, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, LoadingState } from "@/components/common/state-message";
import { FormField } from "@/components/forms/form-field";
import { ReportView } from "@/components/reports/report-view";
import { ReviewHistory } from "@/components/reports/review-history";
import { StatusBadge } from "@/components/reports/status-badge";
import { VersionList } from "@/components/reports/version-history";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useApiData } from "@/hooks/use-api-data";
import { formatDateTime, formatWeek } from "@/lib/format";
import { reportsApi } from "@/lib/reports-api";

type ReviewAction = "approve" | "changes";

/** Manager opens a submitted report and approves it or requests changes with a comment. */
export default function ReviewReportPage({ params }: PageProps<"/review/[id]">) {
  const { id } = use(params);
  const reportId = Number(id);
  const report = useApiData(() => reportsApi.get(reportId), [reportId]);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string>();
  const [busy, setBusy] = useState<ReviewAction | null>(null);

  if (report.error) return <ErrorState error={report.error} onRetry={report.reload} />;
  if (!report.data) return <LoadingState />;

  const detail = report.data;

  async function review(action: ReviewAction) {
    const trimmed = comment.trim();
    if (action === "changes" && !trimmed) {
      setCommentError("Explain what needs to change");
      return;
    }

    setBusy(action);
    try {
      if (action === "approve") {
        await reportsApi.approve(detail.id, trimmed || undefined);
        toast.success(`${detail.userName}'s report approved`);
      } else {
        await reportsApi.requestChanges(detail.id, trimmed);
        toast.success(`Sent back to ${detail.userName} for correction`);
      }
      setComment("");
      report.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the review");
    } finally {
      setBusy(null);
    }
  }

  return (
    <RequireRole roles={["MANAGER", "ADMIN"]}>
      <PageHeader
        title={`Review: ${detail.userName}`}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatWeek(detail.weekStart, detail.weekEnd)}</span>
            <StatusBadge status={detail.status} />
            <span>Version {detail.currentVersion}</span>
            {detail.submittedAt && <span>Submitted {formatDateTime(detail.submittedAt)}</span>}
          </span>
        }
        actions={
          <Link href={`/team/${detail.userId}`} className={buttonVariants({ variant: "outline" })}>
            Member profile
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <ReportView content={detail.content} />

          {detail.currentVersion > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>All submitted versions</CardTitle>
                <CardDescription>
                  This report went through corrections. Each version shows the comments made against it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VersionList reportId={detail.id} />
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Review decision</CardTitle>
              <CardDescription>You are reviewing version {detail.currentVersion}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.permissions.canReview ? (
                <>
                  <FormField
                    label="Comment"
                    htmlFor="review-comment"
                    error={commentError}
                    hint="Required when requesting changes, optional when approving."
                  >
                    <Textarea
                      id="review-comment"
                      rows={5}
                      maxLength={2000}
                      value={comment}
                      aria-invalid={!!commentError}
                      onChange={(event) => {
                        setComment(event.target.value);
                        setCommentError(undefined);
                      }}
                    />
                  </FormField>
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => review("approve")} disabled={busy !== null}>
                      <CircleCheck />
                      {busy === "approve" ? "Approving..." : "Approve"}
                    </Button>
                    <Button variant="outline" onClick={() => review("changes")} disabled={busy !== null}>
                      <MessageSquareWarning />
                      {busy === "changes" ? "Sending..." : "Request changes"}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {detail.status === "APPROVED"
                    ? "This report is approved. No further action needed."
                    : detail.status === "NEEDS_CORRECTION"
                      ? "Waiting for the team member to correct and resubmit."
                      : "This report is not ready for review."}
                </p>
              )}
            </CardContent>
          </Card>

          <ReviewHistory reviews={detail.reviewHistory} />
        </aside>
      </div>
    </RequireRole>
  );
}
