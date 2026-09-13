"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatWeek } from "@/lib/format";
import type { ReportSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

interface ReportTableProps {
  reports: ReportSummary[];
  /** Show the member column (manager views). */
  showMember?: boolean;
  /** Where a row leads; return null for rows that can't be opened (e.g. a manager looking at a draft). */
  linkFor?: (report: ReportSummary) => string | null;
}

/** Report list used by the member's history page and the manager's team views. */
export function ReportTable({ reports, showMember = false, linkFor = (report) => `/reports/${report.id}` }: ReportTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {showMember && <TableHead>Member</TableHead>}
            <TableHead>Week</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Version</TableHead>
            <TableHead className="text-right">Tasks done</TableHead>
            <TableHead className="text-right">Blockers</TableHead>
            <TableHead>Last updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const href = linkFor(report);
            return (
              <TableRow
                key={report.id}
                className={cn(href && "cursor-pointer")}
                onClick={href ? () => router.push(href) : undefined}
              >
                {showMember && <TableCell className="font-medium">{report.userName}</TableCell>}
                <TableCell className="whitespace-nowrap">
                  {href ? (
                    <Link href={href} className="font-medium hover:underline" onClick={(event) => event.stopPropagation()}>
                      {formatWeek(report.weekStart, report.weekEnd)}
                    </Link>
                  ) : (
                    formatWeek(report.weekStart, report.weekEnd)
                  )}
                </TableCell>
                <TableCell>{report.projectName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <StatusBadge status={report.status} />
                </TableCell>
                <TableCell className="text-right">{report.currentVersion > 0 ? `v${report.currentVersion}` : "—"}</TableCell>
                <TableCell className="text-right">
                  {report.completedTaskCount}/{report.taskCount}
                </TableCell>
                <TableCell className="text-right">{report.blockerCount}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(report.updatedAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** Managers review submitted reports, view others, and can't open private drafts. */
export function managerReportLink(report: ReportSummary) {
  if (report.status === "DRAFT") return null;
  return report.status === "SUBMITTED" ? `/review/${report.id}` : `/reports/${report.id}`;
}
