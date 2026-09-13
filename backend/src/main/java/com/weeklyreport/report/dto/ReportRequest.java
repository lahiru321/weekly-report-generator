package com.weeklyreport.report.dto;

import com.weeklyreport.report.TaskType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Body for creating or updating a report. Drafts may be incomplete;
 * completeness (project + at least one task) is checked on submit.
 */
public record ReportRequest(
        @NotNull(message = "Week is required") LocalDate weekStart,
        Long projectId,
        @Size(max = 30) List<@Valid @NotNull TaskDto> tasks,
        @Size(max = 30) List<@NotBlank @Size(max = 500) String> nextWeekTasks,
        @Size(max = 20) List<@Valid @NotNull ReportItemDto> blockers,
        @Size(max = 20) List<@Valid @NotNull ReportItemDto> achievements,
        Map<TaskType, @NotNull @DecimalMin("0.0") @DecimalMax("168.0") BigDecimal> hoursByType,
        @Size(max = 5000) String notes,
        @Size(max = 2000) String links
) {
    public ReportRequest {
        tasks = tasks == null ? List.of() : tasks;
        nextWeekTasks = nextWeekTasks == null ? List.of() : nextWeekTasks;
        blockers = blockers == null ? List.of() : blockers;
        achievements = achievements == null ? List.of() : achievements;
        hoursByType = hoursByType == null ? Map.of() : hoursByType;
    }
}
