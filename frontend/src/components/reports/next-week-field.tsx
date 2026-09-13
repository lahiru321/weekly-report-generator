"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportFormValues } from "./report-form-schema";

export function NextWeekField({ form }: { form: UseFormReturn<ReportFormValues> }) {
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "nextWeekTasks" });

  return (
    <div className="space-y-2">
      {fields.length === 0 && <p className="text-sm text-muted-foreground">Nothing planned yet.</p>}

      {fields.map((field, index) => (
        <div key={field.id}>
          <div className="flex items-center gap-2">
            <Input
              placeholder="What will you work on?"
              aria-label={`Next week task ${index + 1}`}
              aria-invalid={!!errors.nextWeekTasks?.[index]?.value}
              {...register(`nextWeekTasks.${index}.value`)}
            />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(index)}>
              <Trash2 />
            </Button>
          </div>
          <FieldError message={errors.nextWeekTasks?.[index]?.value?.message} />
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
        <Plus />
        Add planned task
      </Button>
    </div>
  );
}
