"use client";

import { useState } from "react";
import Link from "next/link";
import { ErrorState, LoadingState } from "@/components/common/state-message";
import { NativeSelect } from "@/components/forms/native-select";
import { StatusBadge } from "@/components/reports/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";
import { dashboardApi } from "@/lib/dashboard-api";
import type { ReportSection } from "@/lib/types";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<ReportSection, string> = {
  BLOCKERS: "Blockers",
  ACHIEVEMENTS: "Achievements",
  NEXT_WEEK: "Plans for next week",
};

/** Shows one section of every submitted report side by side, so managers don't open each report. */
export function SectionCompare({ week }: { week: string }) {
  const [section, setSection] = useState<ReportSection>("BLOCKERS");
  const entries = useApiData(() => dashboardApi.section(section, week), [section, week]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Compare across the team</CardTitle>
          <CardDescription>One section from every submitted report this week.</CardDescription>
        </div>
        <NativeSelect
          aria-label="Section"
          className="w-52"
          value={section}
          onChange={(event) => setSection(event.target.value as ReportSection)}
        >
          {Object.entries(SECTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </CardHeader>
      <CardContent>
        {entries.error ? (
          <ErrorState error={entries.error} onRetry={entries.reload} />
        ) : !entries.data ? (
          <LoadingState />
        ) : entries.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submitted reports for this week yet.</p>
        ) : (
          <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", entries.loading && "opacity-60")}>
            {entries.data.map((entry) => (
              <div key={entry.reportId} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Link href={`/reports/${entry.reportId}`} className="font-medium hover:underline">
                    {entry.fullName}
                  </Link>
                  <StatusBadge status={entry.status} />
                </div>
                {entry.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing listed.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {entry.items.map((item, index) => (
                      <li
                        key={index}
                        className={cn(
                          "rounded-md px-2 py-1",
                          item.isKey ? "bg-amber-50 font-medium dark:bg-amber-950/40" : "bg-muted/40",
                        )}
                      >
                        {item.isKey && <span className="mr-1 text-xs uppercase text-muted-foreground">Key:</span>}
                        {item.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
