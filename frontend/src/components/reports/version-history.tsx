"use client";

import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/common/state-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";
import { formatDateTime } from "@/lib/format";
import { reportsApi } from "@/lib/reports-api";
import { ReportView } from "./report-view";

/** Past submitted versions of a report, loaded only when the user asks for them. */
export function VersionHistory({ reportId, currentVersion }: { reportId: number; currentVersion: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Submitted versions</CardTitle>
          <CardDescription>
            {currentVersion} version{currentVersion === 1 ? "" : "s"} submitted. Earlier versions are kept when a report
            is corrected and resubmitted.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide versions" : "Show versions"}
        </Button>
      </CardHeader>
      {open && (
        <CardContent>
          <VersionList reportId={reportId} />
        </CardContent>
      )}
    </Card>
  );
}

export function VersionList({ reportId }: { reportId: number }) {
  const versions = useApiData(() => reportsApi.versions(reportId), [reportId]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (versions.error) return <ErrorState error={versions.error} onRetry={versions.reload} />;
  if (!versions.data) return <LoadingState />;

  return (
    <ul className="divide-y rounded-lg border">
      {versions.data.map((version, index) => (
        <li key={version.id} className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">
                Version {version.versionNo}
                {index === 0 && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal">Latest</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">Submitted {formatDateTime(version.submittedAt)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
            >
              {expandedId === version.id ? "Hide content" : "View content"}
            </Button>
          </div>

          {version.reviews.map((review) => (
            <p key={review.id} className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{review.action === "APPROVED" ? "Approved" : "Changes requested"}</span>
              {review.comment && `: ${review.comment}`}
              <span className="text-xs text-muted-foreground">
                {" "}
                — {review.reviewerName}, {formatDateTime(review.createdAt)}
              </span>
            </p>
          ))}

          {expandedId === version.id && (
            <div className="mt-4">
              <ReportView content={version.content} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
