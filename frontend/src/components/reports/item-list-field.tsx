"use client";

import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ReportFormValues } from "./report-form-schema";

interface ItemListFieldProps {
  form: UseFormReturn<ReportFormValues>;
  name: "blockers" | "achievements";
  addLabel: string;
  keyLabel: string;
  placeholder: string;
}

/** A list of blockers or achievements where at most one item can be flagged as the key one. */
export function ItemListField({ form, name, addLabel, keyLabel, placeholder }: ItemListFieldProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name });
  const items = useWatch({ control, name });

  // Checking one item unchecks all others
  function flagAsKey(index: number, checked: boolean) {
    fields.forEach((_, i) => {
      setValue(`${name}.${i}.isKey`, checked && i === index, { shouldDirty: true });
    });
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="text-sm text-muted-foreground">Nothing added yet.</p>}

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Textarea
              rows={2}
              placeholder={placeholder}
              aria-label={`${addLabel} ${index + 1}`}
              aria-invalid={!!errors[name]?.[index]?.description}
              {...register(`${name}.${index}.description`)}
            />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(index)}>
              <Trash2 />
            </Button>
          </div>
          <FieldError message={errors[name]?.[index]?.description?.message} />
          <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={items?.[index]?.isKey ?? false}
              onChange={(event) => flagAsKey(index, event.target.checked)}
            />
            {keyLabel}
          </label>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ description: "", isKey: false })}
      >
        <Plus />
        {addLabel}
      </Button>
    </div>
  );
}
