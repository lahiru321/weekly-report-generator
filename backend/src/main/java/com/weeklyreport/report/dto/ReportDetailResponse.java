package com.weeklyreport.report.dto;

import com.weeklyreport.report.ReportStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ReportDetailResponse(
        Long id,
        Long userId,
        String userName,
        LocalDate weekStart,
        LocalDate weekEnd,
        ReportStatus status,
        int currentVersion,
        Instant submittedAt,
        Instant createdAt,
        Instant updatedAt,
        ReportContent content,
        ReviewResponse latestReview,
        List<ReviewResponse> reviewHistory,
        ReportPermissions permissions
) {
}
