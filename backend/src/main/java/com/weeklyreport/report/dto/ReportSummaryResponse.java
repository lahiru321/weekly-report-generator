package com.weeklyreport.report.dto;

import com.weeklyreport.report.ReportStatus;

import java.time.Instant;
import java.time.LocalDate;

/** One row in a report list (history page, manager's team list). */
public record ReportSummaryResponse(
        Long id,
        Long userId,
        String userName,
        Long projectId,
        String projectName,
        LocalDate weekStart,
        LocalDate weekEnd,
        ReportStatus status,
        int currentVersion,
        int taskCount,
        int completedTaskCount,
        int blockerCount,
        Instant submittedAt,
        Instant updatedAt
) {
}
