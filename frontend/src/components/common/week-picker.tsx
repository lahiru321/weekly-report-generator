"use client";

import { addWeeks, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currentWeekStart, formatWeek, toIsoDate, weekStartOf } from "@/lib/format";

/** Picks a week (value is the Monday as yyyy-MM-dd). Future weeks are not selectable. */
export function WeekPicker({ value, onChange }: { value: string; onChange: (weekStart: string) => void }) {
  const thisWeek = currentWeekStart();
  const isCurrentWeek = value >= thisWeek;

  function shift(weeks: number) {
    onChange(toIsoDate(addWeeks(parseISO(value), weeks)));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => shift(-1)}>
        <ChevronLeft />
      </Button>
      <Input
        type="date"
        aria-label="Week"
        className="w-40"
        value={value}
        max={thisWeek}
        onChange={(event) => event.target.value && onChange(weekStartOf(event.target.value))}
      />
      <Button variant="outline" size="icon" aria-label="Next week" disabled={isCurrentWeek} onClick={() => shift(1)}>
        <ChevronRight />
      </Button>
      <span className="text-sm text-muted-foreground">{formatWeek(value)}</span>
      {!isCurrentWeek && (
        <Button variant="ghost" size="sm" onClick={() => onChange(thisWeek)}>
          This week
        </Button>
      )}
    </div>
  );
}
