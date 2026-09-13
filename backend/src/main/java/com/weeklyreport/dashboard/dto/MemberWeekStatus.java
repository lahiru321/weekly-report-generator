package com.weeklyreport.dashboard.dto;

import java.time.Instant;

/**
 * Where one team member stands for a week.
 *
 * @param status   a ReportStatus name, or NOT_STARTED when there is no report
 * @param reportId null when there is no report or it is still a private draft
 * @param late     submitted after the deadline, or not submitted and the deadline has passed
 */
public record MemberWeekStatus(
        Long userId,
        String fullName,
        String status,
        Long reportId,
        Instant firstSubmittedAt,
        boolean late,
        int completedTasks,
        int blockerCount
) {
    public boolean hasSubmitted() {
        return firstSubmittedAt != null;
    }
}
