import Link from "next/link";
import { formatDateTime, formatWeek } from "@/lib/format";
import type { ActivityItem, ActivityType } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT_COLORS: Record<ActivityType, string> = {
  SUBMITTED: "bg-blue-500",
  RESUBMITTED: "bg-blue-500",
  APPROVED: "bg-emerald-500",
  CHANGES_REQUESTED: "bg-amber-500",
};

function describe(item: ActivityItem) {
  switch (item.type) {
    case "SUBMITTED":
      return `${item.memberName} submitted a report`;
    case "RESUBMITTED":
      return `${item.memberName} resubmitted a corrected report (version ${item.versionNo})`;
    case "APPROVED":
      return `${item.actorName} approved ${item.memberName}'s report`;
    case "CHANGES_REQUESTED":
      return `${item.actorName} sent ${item.memberName}'s report back for correction`;
  }
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={`${item.type}-${item.reportId}-${item.at}-${index}`} className="flex gap-3">
          <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT_COLORS[item.type])} />
          <div className="min-w-0 text-sm">
            <Link href={`/reports/${item.reportId}`} className="font-medium hover:underline">
              {describe(item)}
            </Link>
            {item.comment && <p className="mt-0.5 truncate text-muted-foreground">&ldquo;{item.comment}&rdquo;</p>}
            <p className="text-xs text-muted-foreground">
              Week of {formatWeek(item.weekStart)} · {formatDateTime(item.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
