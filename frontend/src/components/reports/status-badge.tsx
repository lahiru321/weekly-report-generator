import { REPORT_STATUS_LABELS } from "@/lib/labels";
import type { ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export type DisplayStatus = ReportStatus | "NOT_STARTED";

const STATUS_STYLES: Record<DisplayStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600",
  SUBMITTED: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  NEEDS_CORRECTION: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  NOT_STARTED: "bg-transparent text-muted-foreground ring-border",
};

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  const label = status === "NOT_STARTED" ? "Not started" : REPORT_STATUS_LABELS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
