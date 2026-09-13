package com.weeklyreport.dashboard.dto;

import java.time.LocalDate;

/**
 * Headline numbers for one week.
 * "Submitted" means submitted at least once; "late" means first submitted after the deadline.
 */
public record DashboardSummary(
        LocalDate weekStart,
        LocalDate weekEnd,
        int activeMembers,
        int submitted,
        int submittedOnTime,
        int submittedLate,
        int pending,
        int overdue,
        double complianceRate,
        long needsCorrection,
        long awaitingReview,
        int openBlockers
) {
}
