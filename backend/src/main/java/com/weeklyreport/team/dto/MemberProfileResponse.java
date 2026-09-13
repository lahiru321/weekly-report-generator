package com.weeklyreport.team.dto;

import com.weeklyreport.user.dto.UserResponse;

import java.math.BigDecimal;
import java.util.List;

/** Basic stats for one team member, shown on the manager's member profile page. */
public record MemberProfileResponse(
        UserResponse user,
        List<String> projects,
        int totalReports,
        int approved,
        int awaitingReview,
        int needsCorrection,
        int drafts,
        int onTimeSubmissions,
        int lateSubmissions,
        double averageCompletedTasks,
        BigDecimal totalHoursLogged,
        int blockersInLatestReport
) {
}
