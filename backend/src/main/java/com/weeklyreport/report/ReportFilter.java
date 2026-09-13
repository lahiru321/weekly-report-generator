package com.weeklyreport.report;

import java.time.LocalDate;

/** Optional filters for report lists. A null field means "don't filter on this". */
public record ReportFilter(Long userId, Long projectId, ReportStatus status, LocalDate from, LocalDate to) {
}
