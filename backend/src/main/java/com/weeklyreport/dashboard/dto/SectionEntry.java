package com.weeklyreport.dashboard.dto;

import com.weeklyreport.report.ReportStatus;
import com.weeklyreport.report.dto.ReportItemDto;

import java.util.List;

/** One member's items for a single report section, for the side-by-side view. */
public record SectionEntry(Long reportId, Long userId, String fullName, ReportStatus status, List<ReportItemDto> items) {
}
