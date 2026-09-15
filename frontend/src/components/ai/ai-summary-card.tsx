"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiNotConfigured } from "@/components/ai/ai-not-configured";
import { ErrorState, LoadingState } from "@/components/common/state-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";
import { aiApi } from "@/lib/ai-api";
import type { AiReply } from "@/lib/types";

/** Dashboard card that asks the AI for a summary of the selected week. Generated only on click, since each call costs money. */
export function AiSummaryCard({ week }: { week: string }) {
  const status = useApiData(() => aiApi.status(), []);
  const [summary, setSummary] = useState<{ week: string; reply: AiReply } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const enabled = status.data?.enabled === true;
  // A summary belongs to one week, so hide it when the manager picks another week
  const reply = summary?.week === week ? summary.reply : null;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      setSummary({ week, reply: await aiApi.summary(week) });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            AI team summary
          </CardTitle>
          <CardDescription>Completed work, recurring blockers and workload imbalances for this week.</CardDescription>
        </div>
        <Button variant="outline" onClick={generate} disabled={!enabled || loading}>
          {loading ? "Writing..." : reply ? "Regenerate" : "Generate summary"}
        </Button>
      </CardHeader>
      <CardContent>
        {status.data && !enabled ? (
          <AiNotConfigured />
        ) : loading ? (
          <LoadingState label="Reading this week's reports..." />
        ) : error ? (
          <ErrorState error={error} onRetry={generate} />
        ) : reply ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.text}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Click “Generate summary” to get an AI overview of the team&apos;s reports.</p>
        )}
      </CardContent>
    </Card>
  );
}
