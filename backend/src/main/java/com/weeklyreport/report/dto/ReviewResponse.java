package com.weeklyreport.report.dto;

import com.weeklyreport.report.ReviewActionType;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        int versionNo,
        Long reviewerId,
        String reviewerName,
        ReviewActionType action,
        String comment,
        Instant createdAt
) {
}
