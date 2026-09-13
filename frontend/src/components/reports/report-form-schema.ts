import { z } from "zod";
import { TASK_TYPES } from "@/lib/labels";
import type { ReportDetail, ReportRequest, TaskType } from "@/lib/types";

const numberBetween = (min: number, max: number) =>
  z.number({ error: "Required" }).min(min, `Min ${min}`).max(max, `Max ${max}`);

const taskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required").max(200),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  plannedPct: numberBetween(0, 100),
  actualPct: numberBetween(0, 100),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"]),
  plannedHours: numberBetween(0, 168),
  spentHours: numberBetween(0, 168),
  output: z.string().max(500),
});

const itemSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(500),
  isKey: z.boolean(),
});

/** Client-side validation. Mirrors the rules in ReportRequest.java; the server re-checks everything. */
export const reportFormSchema = z.object({
  weekStart: z.string().min(1, "Week is required"),
  projectId: z.string(),
  tasks: z.array(taskSchema).max(30, "At most 30 tasks"),
  // useFieldArray needs objects, so plain strings are wrapped as { value }
  nextWeekTasks: z.array(z.object({ value: z.string().trim().min(1, "Required").max(500) })).max(30),
  blockers: z.array(itemSchema).max(20),
  achievements: z.array(itemSchema).max(20),
  hoursByType: z.object({
    DEVELOPMENT: numberBetween(0, 168),
    TESTING: numberBetween(0, 168),
    MEETINGS: numberBetween(0, 168),
    DOCUMENTATION: numberBetween(0, 168),
    OTHER: numberBetween(0, 168),
  }),
  notes: z.string().max(5000),
  links: z.string().max(2000),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;
export type TaskFormValues = ReportFormValues["tasks"][number];

export function emptyTask(): TaskFormValues {
  return {
    name: "",
    priority: "MEDIUM",
    plannedPct: 100,
    actualPct: 0,
    status: "IN_PROGRESS",
    plannedHours: 0,
    spentHours: 0,
    output: "",
  };
}

export function toFormValues(report: ReportDetail | undefined, defaultWeekStart: string): ReportFormValues {
  const content = report?.content;
  return {
    weekStart: report?.weekStart ?? defaultWeekStart,
    projectId: content?.projectId ? String(content.projectId) : "",
    tasks: content
      ? content.tasks.map((task) => ({
          ...task,
          plannedHours: Number(task.plannedHours),
          spentHours: Number(task.spentHours),
          output: task.output ?? "",
        }))
      : [emptyTask()],
    nextWeekTasks: (content?.nextWeekTasks ?? []).map((value) => ({ value })),
    blockers: content?.blockers ?? [],
    achievements: content?.achievements ?? [],
    hoursByType: Object.fromEntries(
      TASK_TYPES.map((type) => [type, Number(content?.hoursByType[type] ?? 0)]),
    ) as Record<TaskType, number>,
    notes: content?.notes ?? "",
    links: content?.links ?? "",
  };
}

export function toRequest(values: ReportFormValues): ReportRequest {
  return {
    weekStart: values.weekStart,
    projectId: values.projectId ? Number(values.projectId) : null,
    tasks: values.tasks.map((task) => ({ ...task, output: task.output.trim() || null })),
    nextWeekTasks: values.nextWeekTasks.map((task) => task.value),
    blockers: values.blockers,
    achievements: values.achievements,
    hoursByType: values.hoursByType,
    notes: values.notes,
    links: values.links,
  };
}

/** Server error paths look like "tasks[0].name"; react-hook-form paths look like "tasks.0.name". */
export function toFormPath(serverPath: string) {
  const path = serverPath.replace(/\[(\d+)\]/g, ".$1");
  return /^nextWeekTasks\.\d+$/.test(path) ? `${path}.value` : path;
}
