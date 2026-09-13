"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { formatHours, formatWeek, weekStartOf } from "@/lib/format";
import { TASK_TYPE_LABELS, TASK_TYPES } from "@/lib/labels";
import { reportsApi } from "@/lib/reports-api";
import type { Project, ReportDetail } from "@/lib/types";
import { ItemListField } from "./item-list-field";
import { NextWeekField } from "./next-week-field";
import { reportFormSchema, toFormPath, toFormValues, toRequest, type ReportFormValues } from "./report-form-schema";
import { TaskTableField } from "./task-table-field";

interface ReportFormProps {
  /** Existing report to edit; omit to create a new one. */
  report?: ReportDetail;
  defaultWeekStart: string;
  projects: Project[];
  /** The week is chosen outside the form (e.g. by a week picker), so the week field is read-only. */
  lockWeek?: boolean;
}

/** The fixed weekly report form. Every user gets exactly the same sections in the same order. */
export function ReportForm({ report, defaultWeekStart, projects, lockWeek = false }: ReportFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: toFormValues(report, defaultWeekStart),
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = form;

  const weekStart = useWatch({ control, name: "weekStart" });
  const hours = useWatch({ control, name: "hoursByType" });
  const totalHours = TASK_TYPES.reduce((sum, type) => sum + (Number(hours?.[type]) || 0), 0);
  const submittedBefore = (report?.currentVersion ?? 0) > 0;
  const weekLocked = lockWeek || submittedBefore;

  function checkReadyToSubmit(values: ReportFormValues) {
    let ready = true;
    if (!values.projectId) {
      setError("projectId", { message: "Choose a project before submitting" });
      ready = false;
    }
    if (values.tasks.length === 0) {
      setError("tasks", { message: "Add at least one task before submitting" });
      ready = false;
    }
    return ready;
  }

  async function save(values: ReportFormValues, andSubmit: boolean) {
    if (andSubmit && !checkReadyToSubmit(values)) {
      toast.error("Please complete the report before submitting");
      return;
    }

    setBusy(andSubmit ? "submit" : "draft");
    let savedId = report?.id;
    try {
      const body = toRequest(values);
      const saved = report ? await reportsApi.update(report.id, body) : await reportsApi.create(body);
      savedId = saved.id;

      if (andSubmit) {
        await reportsApi.submit(saved.id);
        toast.success("Report submitted for review");
        router.push(`/reports/${saved.id}`);
      } else {
        toast.success("Draft saved");
        if (!report) router.replace(`/reports/${saved.id}/edit`);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [path, message] of Object.entries(error.fieldErrors)) {
          setError(toFormPath(path) as Path<ReportFormValues>, { message });
        }
      }
      toast.error(error instanceof Error ? error.message : "Could not save the report");
      // A new report may have been created before submit failed; continue on its edit page
      if (!report && savedId) router.replace(`/reports/${savedId}/edit`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <form className="space-y-6" noValidate onSubmit={(event) => event.preventDefault()}>
      <Card>
        <CardHeader>
          <CardTitle>Week & project</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Week"
            htmlFor="weekStart"
            error={errors.weekStart?.message}
            hint={
              submittedBefore
                ? "The week can't change after the first submission."
                : lockWeek
                  ? `Covers ${formatWeek(weekStart)}. Use the week picker above to change it.`
                  : weekStart
                    ? `Covers ${formatWeek(weekStart)}`
                    : "Pick any day of the week"
            }
          >
            <Input
              id="weekStart"
              type="date"
              readOnly={weekLocked}
              {...register("weekStart", { setValueAs: (value: string) => (value ? weekStartOf(value) : value) })}
            />
          </FormField>

          <FormField label="Project / category" htmlFor="projectId" error={errors.projectId?.message}>
            <NativeSelect id="projectId" aria-invalid={!!errors.projectId} {...register("projectId")}>
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks completed</CardTitle>
          <CardDescription>Planned vs. actual progress and time for each task this week.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskTableField form={form} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks planned for next week</CardTitle>
        </CardHeader>
        <CardContent>
          <NextWeekField form={form} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blockers / challenges</CardTitle>
            <CardDescription>Flag the most important one as the key issue.</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemListField
              form={form}
              name="blockers"
              addLabel="Add blocker"
              keyLabel="Key issue of the week"
              placeholder="What slowed you down?"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements / highlights</CardTitle>
            <CardDescription>Flag the most important one as the key achievement.</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemListField
              form={form}
              name="achievements"
              addLabel="Add achievement"
              keyLabel="Key achievement of the week"
              placeholder="What went well?"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hours by task type</CardTitle>
          <CardDescription>Optional. Total: {formatHours(totalHours)}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {TASK_TYPES.map((type) => (
            <FormField
              key={type}
              label={TASK_TYPE_LABELS[type]}
              htmlFor={`hours-${type}`}
              error={errors.hoursByType?.[type]?.message}
            >
              <Input
                id={`hours-${type}`}
                type="number"
                min={0}
                step={0.5}
                {...register(`hoursByType.${type}`, {
                  setValueAs: (value: string) => (value === "" ? 0 : Number(value)),
                })}
              />
            </FormField>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes & links</CardTitle>
          <CardDescription>Optional.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <FormField label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <Textarea id="notes" rows={4} {...register("notes")} />
          </FormField>
          <FormField label="Links" htmlFor="links" error={errors.links?.message} hint="One link per line">
            <Textarea id="links" rows={4} placeholder="https://..." {...register("links")} />
          </FormField>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <Button
          type="button"
          variant="outline"
          disabled={busy !== null}
          onClick={() => handleSubmit((values) => save(values, false))()}
        >
          {busy === "draft" ? "Saving..." : "Save draft"}
        </Button>
        <Button type="button" disabled={busy !== null} onClick={() => handleSubmit((values) => save(values, true))()}>
          {busy === "submit"
            ? "Submitting..."
            : report?.status === "NEEDS_CORRECTION"
              ? "Resubmit for review"
              : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
