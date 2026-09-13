"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/state-message";
import { NativeSelect } from "@/components/forms/native-select";
import { ReportTable } from "@/components/reports/report-table";
import { buttonVariants } from "@/components/ui/button";
import { useApiData } from "@/hooks/use-api-data";
import { REPORT_STATUS_LABELS, REPORT_STATUSES } from "@/lib/labels";
import { reportsApi } from "@/lib/reports-api";
import type { ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ReportHistoryPage() {
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [page, setPage] = useState(0);
  const reports = useApiData(
    () => reportsApi.listMine({ status: status || undefined, page, size: 10 }),
    [status, page],
  );

  const newReportLink = (
    <Link href="/reports/new" className={buttonVariants()}>
      <Plus />
      New report
    </Link>
  );

  return (
    <RequireRole roles={["MEMBER"]}>
      <PageHeader
        title="Report history"
        description="All your weekly reports and where they are in review."
        actions={newReportLink}
      />

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm text-muted-foreground">
          Status
        </label>
        <NativeSelect
          id="status-filter"
          className="w-48"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ReportStatus | "");
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {REPORT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {REPORT_STATUS_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
      </div>

      {reports.error ? (
        <ErrorState error={reports.error} onRetry={reports.reload} />
      ) : !reports.data ? (
        <LoadingState />
      ) : reports.data.content.length === 0 ? (
        <EmptyState
          title={status ? "No reports with this status" : "No reports yet"}
          description={status ? undefined : "Create your first weekly report to get started."}
          action={status ? undefined : newReportLink}
        />
      ) : (
        <div className={cn("transition-opacity", reports.loading && "opacity-60")}>
          <ReportTable reports={reports.data.content} />
          <Pagination page={reports.data.page} totalPages={reports.data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </RequireRole>
  );
}
