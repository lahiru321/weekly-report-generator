package com.weeklyreport.report;

import java.time.Instant;

/** When a report was first submitted; used to decide whether it was on time. */
public record FirstSubmission(Long reportId, Instant submittedAt) {
}
