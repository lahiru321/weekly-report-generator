package com.weeklyreport.dashboard.dto;

import java.time.Instant;
import java.time.LocalDate;

/**
 * One entry in the recent activity feed.
 *
 * @param type SUBMITTED, RESUBMITTED, APPROVED or CHANGES_REQUESTED
 */
public record ActivityItem(
        String type,
        Long reportId,
        String memberName,
        LocalDate weekStart,
        int versionNo,
        String actorName,
        String comment,
        Instant at
) {
}
