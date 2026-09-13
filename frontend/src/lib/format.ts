import { addDays, format, parseISO, startOfWeek } from "date-fns";

// Weeks run Monday to Sunday, matching the backend (WeekUtils.java)

export function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/** "2026-09-10" (a Thursday) -> "2026-09-07" (that week's Monday) */
export function weekStartOf(isoDate: string) {
  return toIsoDate(startOfWeek(parseISO(isoDate), { weekStartsOn: 1 }));
}

export function currentWeekStart() {
  return toIsoDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
}

export function formatWeek(weekStart: string, weekEnd?: string) {
  const start = parseISO(weekStart);
  const end = weekEnd ? parseISO(weekEnd) : addDays(start, 6);
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function formatDateTime(value: string | null | undefined) {
  return value ? format(parseISO(value), "MMM d, yyyy 'at' h:mm a") : "—";
}

export function formatHours(value: number | undefined) {
  return `${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}h`;
}
