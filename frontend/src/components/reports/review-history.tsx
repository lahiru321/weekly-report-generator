import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { ReviewEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Every review decision on a report, newest first. */
export function ReviewHistory({ reviews }: { reviews: ReviewEntry[] }) {
  if (reviews.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review history</CardTitle>
        <CardDescription>All review decisions, newest first.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4 border-l pl-4">
          {reviews.map((review) => (
            <li key={review.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[21px] top-1.5 size-2.5 rounded-full",
                  review.action === "APPROVED" ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              <p className="text-sm font-medium">
                {review.action === "APPROVED" ? "Approved" : "Changes requested"}
                <span className="font-normal text-muted-foreground"> · version {review.versionNo}</span>
              </p>
              {review.comment && <p className="mt-1 whitespace-pre-wrap text-sm">{review.comment}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {review.reviewerName} · {formatDateTime(review.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
