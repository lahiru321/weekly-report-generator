import Link from "next/link";
import { StatusBadge } from "@/components/reports/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { MemberWeekStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function timeliness(row: MemberWeekStatus) {
  if (row.firstSubmittedAt) {
    return row.late ? { label: "Late", className: "text-amber-700 dark:text-amber-400" } : { label: "On time", className: "text-emerald-700 dark:text-emerald-400" };
  }
  return row.late ? { label: "Overdue", className: "text-destructive" } : { label: "Pending", className: "text-muted-foreground" };
}

/** Submission status of every active team member for one week, including those who haven't started. */
export function TeamStatusTable({ rows }: { rows: MemberWeekStatus[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timeliness</TableHead>
            <TableHead>First submitted</TableHead>
            <TableHead className="text-right">Tasks done</TableHead>
            <TableHead className="text-right">Blockers</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const { label, className } = timeliness(row);
            return (
              <TableRow key={row.userId}>
                <TableCell>
                  <Link href={`/team/${row.userId}`} className="font-medium hover:underline">
                    {row.fullName}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className={cn("font-medium", className)}>{label}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.firstSubmittedAt)}</TableCell>
                <TableCell className="text-right">{row.reportId ? row.completedTasks : "—"}</TableCell>
                <TableCell className="text-right">{row.reportId ? row.blockerCount : "—"}</TableCell>
                <TableCell className="text-right">
                  {row.reportId === null ? (
                    <span className="text-xs text-muted-foreground">{row.status === "DRAFT" ? "Private draft" : "—"}</span>
                  ) : row.status === "SUBMITTED" ? (
                    <Link href={`/review/${row.reportId}`} className={buttonVariants({ size: "sm" })}>
                      Review
                    </Link>
                  ) : (
                    <Link href={`/reports/${row.reportId}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                      View
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
