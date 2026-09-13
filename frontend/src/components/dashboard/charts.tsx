"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TASK_TYPE_LABELS } from "@/lib/labels";
import type { DashboardCharts } from "@/lib/types";

const PALETTE = ["#2563eb", "#16a34a", "#f59e0b", "#db2777", "#7c3aed", "#0891b2", "#dc2626", "#65a30d"];

const STATUS_BARS = [
  { key: "approved", name: "Approved", color: "#16a34a" },
  { key: "submitted", name: "Submitted", color: "#2563eb" },
  { key: "needsCorrection", name: "Needs correction", color: "#f59e0b" },
  { key: "draft", name: "Draft", color: "#94a3b8" },
  { key: "missing", name: "No report", color: "#e2e8f0" },
] as const;

const AXIS_PROPS = { fontSize: 12, tickLine: false, axisLine: false } as const;

function ChartCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function TasksTrendChart({ data }: { data: DashboardCharts }) {
  const [perPerson, setPerPerson] = useState(false);
  const rows = data.tasksCompletedTrend.map((point) => ({
    week: format(parseISO(point.weekStart), "MMM d"),
    Team: point.total,
    ...Object.fromEntries(data.members.map((member) => [member.fullName, point.byMember[String(member.id)] ?? 0])),
  }));

  return (
    <ChartCard
      title="Tasks completed"
      description="Completed tasks per week in submitted reports"
      action={
        <Button variant="outline" size="sm" onClick={() => setPerPerson((value) => !value)}>
          {perPerson ? "Team total" : "Per person"}
        </Button>
      }
    >
      <LineChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="week" {...AXIS_PROPS} />
        <YAxis allowDecimals={false} width={32} {...AXIS_PROPS} />
        <Tooltip />
        <Legend />
        {perPerson ? (
          data.members.map((member, index) => (
            <Line
              key={member.id}
              type="monotone"
              dataKey={member.fullName}
              stroke={PALETTE[index % PALETTE.length]}
              strokeWidth={2}
              dot={false}
            />
          ))
        ) : (
          <Line type="monotone" dataKey="Team" stroke={PALETTE[0]} strokeWidth={2} />
        )}
      </LineChart>
    </ChartCard>
  );
}

export function StatusByMemberChart({ data }: { data: DashboardCharts }) {
  return (
    <ChartCard title="Report status by team member" description="How each person's weeks ended up">
      <BarChart data={data.statusByMember}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="fullName" {...AXIS_PROPS} />
        <YAxis allowDecimals={false} width={32} {...AXIS_PROPS} />
        <Tooltip />
        <Legend />
        {STATUS_BARS.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} name={bar.name} stackId="status" fill={bar.color} />
        ))}
      </BarChart>
    </ChartCard>
  );
}

export function WorkloadByProjectChart({ data }: { data: DashboardCharts }) {
  const rows = data.workloadByProject.map((project) => ({ ...project, spentHours: Number(project.spentHours) }));
  return (
    <ChartCard title="Workload by project" description="Hours spent and number of tasks per project">
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="projectName" {...AXIS_PROPS} />
        <YAxis width={40} {...AXIS_PROPS} />
        <Tooltip />
        <Legend />
        <Bar dataKey="spentHours" name="Hours spent" fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
        <Bar dataKey="tasks" name="Tasks" fill={PALETTE[4]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function TimeByTaskTypeChart({ data }: { data: DashboardCharts }) {
  const rows = data.timeByTaskType.map((entry) => ({ name: TASK_TYPE_LABELS[entry.type], value: Number(entry.hours) }));
  return (
    <ChartCard title="Time by task type" description="Team-wide hours, e.g. meetings vs. development">
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={2} label>
          {rows.map((row, index) => (
            <Cell key={row.name} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ChartCard>
  );
}
