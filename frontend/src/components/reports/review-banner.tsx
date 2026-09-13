import { CircleCheck, MessageSquareWarning } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { ReviewEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Highlights the manager's latest decision at the top of a report. */
export function ReviewBanner({ review }: { review: ReviewEntry }) {
  const changesRequested = review.action === "CHANGES_REQUESTED";

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border p-4",
        changesRequested
          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
          : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        {changesRequested ? (
          <MessageSquareWarning className="size-4 text-amber-600" />
        ) : (
          <CircleCheck className="size-4 text-emerald-600" />
        )}
        {changesRequested ? "Changes requested" : "Approved"}
      </div>
      {review.comment && <p className="mt-2 whitespace-pre-wrap text-sm">{review.comment}</p>}
      <p className="mt-2 text-xs text-muted-foreground">
        {review.reviewerName} · {formatDateTime(review.createdAt)} · on version {review.versionNo}
      </p>
    </div>
  );
}
