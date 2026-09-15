"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCheck, FileCheck, MessageSquareWarning } from "lucide-react";
import { AiSummaryCard } from "@/components/ai/ai-summary-card";
import { RequireRole } from "@/components/auth/require-role";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, LoadingState } from "@/components/common/state-message";
import { WeekPicker } from "@/components/common/week-picker";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  StatusByMemberChart,
  TasksTrendChart,
  TimeByTaskTypeChart,
  WorkloadByProjectChart,
} from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionCompare } from "@/components/dashboard/section-compare";
import { TeamStatusTable } from "@/components/dashboard/team-status-table";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiData } from "@/hooks/use-api-data";
import { dashboardApi } from "@/lib/dashboard-api";
import { currentWeekStart } from "@/lib/format";

const CHART_WEEKS = 8;

export default function DashboardPage() {
  const [week, setWeek] = useState(currentWeekStart());
  const summary = useApiData(() => dashboardApi.summary(week), [week]);
  const team = useApiData(() => dashboardApi.teamStatus(week), [week]);
  const charts = useApiData(() => dashboardApi.charts(CHART_WEEKS), []);
  const activity = useApiData(() => dashboardApi.activity(15), []);

  const s = summary.data;

  return (
    <RequireRole roles={["MANAGER", "ADMIN"]}>
      <PageHeader
        title="Team dashboard"
        description="Submissions, reviews and workload across the whole team."
        actions={
          <Link href="/team" className={buttonVariants({ variant: "outline" })}>
            All team reports
          </Link>
        }
      />

      <div className="space-y-6">
        <WeekPicker value={week} onChange={setWeek} />

        {summary.error ? (
          <ErrorState error={summary.error} onRetry={summary.reload} />
        ) : !s ? (
          <LoadingState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Reports submitted"
              icon={FileCheck}
              value={`${s.submitted} / ${s.activeMembers}`}
              hint={`${s.pending} not submitted yet`}
            />
            <MetricCard
              label="Submission compliance"
              icon={CheckCheck}
              value={`${Math.round(s.complianceRate * 100)}%`}
              hint={`${s.submittedOnTime} on time · ${s.submittedLate} late · ${s.pending} pending${s.overdue ? ` (${s.overdue} overdue)` : ""}`}
            />
            <MetricCard
              label="Needs correction"
              icon={MessageSquareWarning}
              tone={s.needsCorrection > 0 ? "warning" : "default"}
              value={s.needsCorrection}
              hint={`${s.awaitingReview} submitted and waiting for review`}
            />
            <MetricCard
              label="Open blockers"
              icon={AlertTriangle}
              tone={s.openBlockers > 0 ? "warning" : "default"}
              value={s.openBlockers}
              hint="In this week's submitted reports"
            />
          </div>
        )}

        <AiSummaryCard week={week} />

        <Card>
          <CardHeader>
            <CardTitle>Submission status</CardTitle>
            <CardDescription>Every active team member for the selected week.</CardDescription>
          </CardHeader>
          <CardContent>
            {team.error ? (
              <ErrorState error={team.error} onRetry={team.reload} />
            ) : !team.data ? (
              <LoadingState />
            ) : (
              <TeamStatusTable rows={team.data} />
            )}
          </CardContent>
        </Card>

        <SectionCompare week={week} />

        {charts.error ? (
          <ErrorState error={charts.error} onRetry={charts.reload} />
        ) : !charts.data ? (
          <LoadingState label="Loading charts..." />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Charts cover the last {CHART_WEEKS} weeks.</p>
            <div className="grid gap-6 lg:grid-cols-2">
              <TasksTrendChart data={charts.data} />
              <StatusByMemberChart data={charts.data} />
              <WorkloadByProjectChart data={charts.data} />
              <TimeByTaskTypeChart data={charts.data} />
            </div>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest submissions and review decisions.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.error ? (
              <ErrorState error={activity.error} onRetry={activity.reload} />
            ) : !activity.data ? (
              <LoadingState />
            ) : (
              <ActivityFeed items={activity.data} />
            )}
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
