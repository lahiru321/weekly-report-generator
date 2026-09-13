package com.weeklyreport.dashboard.dto;

import com.weeklyreport.report.TaskType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Data for the dashboard charts over the last N weeks. */
public record DashboardCharts(
        List<MemberRef> members,
        List<WeekPoint> tasksCompletedTrend,
        List<MemberStatusCounts> statusByMember,
        List<ProjectWorkload> workloadByProject,
        List<TaskTypeHours> timeByTaskType
) {

    public record MemberRef(Long id, String fullName) {
    }

    /** Completed tasks in one week, team total and per member id. */
    public record WeekPoint(LocalDate weekStart, int total, Map<Long, Integer> byMember) {
    }

    /** How many of a member's weeks ended up in each status; "missing" means no report at all. */
    public record MemberStatusCounts(Long userId, String fullName, int approved, int submitted,
                                     int needsCorrection, int draft, int missing) {
    }

    public record ProjectWorkload(String projectName, int reports, int tasks, BigDecimal spentHours) {
    }

    public record TaskTypeHours(TaskType type, BigDecimal hours) {
    }
}
