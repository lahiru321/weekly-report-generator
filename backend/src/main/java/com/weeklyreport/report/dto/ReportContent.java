package com.weeklyreport.report.dto;

import com.weeklyreport.report.TaskType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * The fixed report structure. Used both for the current report and for the JSON snapshot
 * of each submitted version (the project name is copied so old versions stay readable).
 */
public record ReportContent(
        Long projectId,
        String projectName,
        List<TaskDto> tasks,
        List<String> nextWeekTasks,
        List<ReportItemDto> blockers,
        List<ReportItemDto> achievements,
        Map<TaskType, BigDecimal> hoursByType,
        String notes,
        String links
) {
}
