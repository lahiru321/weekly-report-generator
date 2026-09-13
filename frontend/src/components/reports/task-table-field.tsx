"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { FieldError } from "@/components/forms/field-error";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/labels";
import { emptyTask, type ReportFormValues } from "./report-form-schema";

/** Editable task-level table: name, priority, planned vs actual %, status, planned vs spent hours, output. */
export function TaskTableField({ form }: { form: UseFormReturn<ReportFormValues> }) {
  const {
    control,
    register,
    clearErrors,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "tasks" });
  const listError = errors.tasks?.message ?? errors.tasks?.root?.message;

  return (
    <div className="space-y-3">
      {fields.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-medium">Task</th>
                <th className="px-2 py-2 font-medium">Priority</th>
                <th className="px-2 py-2 font-medium">Planned %</th>
                <th className="px-2 py-2 font-medium">Actual %</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Planned h</th>
                <th className="px-2 py-2 font-medium">Spent h</th>
                <th className="px-2 py-2 font-medium">Output / deliverable</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const rowErrors = errors.tasks?.[index];
                return (
                  <tr key={field.id} className="border-t align-top">
                    <td className="min-w-52 p-2">
                      <Input
                        aria-label="Task name"
                        aria-invalid={!!rowErrors?.name}
                        {...register(`tasks.${index}.name`)}
                      />
                      <FieldError message={rowErrors?.name?.message} />
                    </td>
                    <td className="w-28 p-2">
                      <NativeSelect aria-label="Priority" {...register(`tasks.${index}.priority`)}>
                        {TASK_PRIORITIES.map((priority) => (
                          <option key={priority} value={priority}>
                            {TASK_PRIORITY_LABELS[priority]}
                          </option>
                        ))}
                      </NativeSelect>
                    </td>
                    <td className="w-24 p-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        aria-label="Planned %"
                        aria-invalid={!!rowErrors?.plannedPct}
                        {...register(`tasks.${index}.plannedPct`, { valueAsNumber: true })}
                      />
                      <FieldError message={rowErrors?.plannedPct?.message} />
                    </td>
                    <td className="w-24 p-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        aria-label="Actual %"
                        aria-invalid={!!rowErrors?.actualPct}
                        {...register(`tasks.${index}.actualPct`, { valueAsNumber: true })}
                      />
                      <FieldError message={rowErrors?.actualPct?.message} />
                    </td>
                    <td className="w-36 p-2">
                      <NativeSelect aria-label="Status" {...register(`tasks.${index}.status`)}>
                        {TASK_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {TASK_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </NativeSelect>
                    </td>
                    <td className="w-24 p-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        aria-label="Planned hours"
                        aria-invalid={!!rowErrors?.plannedHours}
                        {...register(`tasks.${index}.plannedHours`, { valueAsNumber: true })}
                      />
                      <FieldError message={rowErrors?.plannedHours?.message} />
                    </td>
                    <td className="w-24 p-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        aria-label="Spent hours"
                        aria-invalid={!!rowErrors?.spentHours}
                        {...register(`tasks.${index}.spentHours`, { valueAsNumber: true })}
                      />
                      <FieldError message={rowErrors?.spentHours?.message} />
                    </td>
                    <td className="min-w-52 p-2">
                      <Input
                        aria-label="Output or deliverable"
                        placeholder="e.g. PR merged, doc published"
                        {...register(`tasks.${index}.output`)}
                      />
                      <FieldError message={rowErrors?.output?.message} />
                    </td>
                    <td className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove task"
                        onClick={() => remove(index)}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {listError && <p className="text-sm text-destructive">{listError}</p>}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          clearErrors("tasks");
          append(emptyTask());
        }}
      >
        <Plus />
        Add task
      </Button>
    </div>
  );
}
