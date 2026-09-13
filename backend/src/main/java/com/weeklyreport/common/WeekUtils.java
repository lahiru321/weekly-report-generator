package com.weeklyreport.common;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

/** Weeks run Monday to Sunday and are identified by their Monday. */
public final class WeekUtils {

    private WeekUtils() {
    }

    public static LocalDate startOfWeek(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    public static LocalDate endOfWeek(LocalDate weekStart) {
        return weekStart.plusDays(6);
    }

    public static LocalDate currentWeekStart() {
        return startOfWeek(LocalDate.now());
    }

    /** A week's report is due before the following Monday starts (server time zone). Later counts as late. */
    public static Instant deadlineFor(LocalDate weekStart) {
        return weekStart.plusWeeks(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
    }
}
