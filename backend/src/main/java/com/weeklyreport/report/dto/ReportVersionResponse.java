package com.weeklyreport.report.dto;

import java.time.Instant;
import java.util.List;

/** A past submitted version plus the review comments made against it. */
public record ReportVersionResponse(
        Long id,
        int versionNo,
        Instant submittedAt,
        ReportContent content,
        List<ReviewResponse> reviews
) {
}
