package com.weeklyreport.ai;

import com.weeklyreport.common.WeekUtils;
import com.weeklyreport.dashboard.DashboardService;
import com.weeklyreport.dashboard.dto.MemberWeekStatus;
import com.weeklyreport.report.Report;
import com.weeklyreport.report.ReportItem;
import com.weeklyreport.report.ReportRepository;
import com.weeklyreport.report.ReportStatus;
import com.weeklyreport.report.ReportTask;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Turns recent reports into compact plain text for the AI prompt.
 * Privacy: drafts are left out (they are private), and only names are used, never emails or ids.
 */
@Component
@RequiredArgsConstructor
public class TeamContextBuilder {

    private final ReportRepository reportRepository;
    private final DashboardService dashboardService;

    @Transactional(readOnly = true)
    public String build(LocalDate latestWeek, int weeks) {
        LocalDate lastWeekStart = WeekUtils.startOfWeek(latestWeek);
        LocalDate firstWeekStart = lastWeekStart.minusWeeks(weeks - 1L);

        StringBuilder text = new StringBuilder();
        text.append("Today is ").append(LocalDate.now()).append(". Weeks run Monday to Sunday.\n");
        text.append("The data covers the weeks starting ").append(firstWeekStart)
                .append(" to ").append(lastWeekStart).append(".\n\n");

        text.append("# Submission status for the week starting ").append(lastWeekStart).append('\n');
        for (MemberWeekStatus member : dashboardService.teamStatus(lastWeekStart)) {
            text.append("- ").append(member.fullName()).append(": ").append(member.status());
            if (member.late()) {
                text.append(" (late)");
            }
            text.append('\n');
        }

        List<Report> reports = reportRepository.findByWeekStartBetween(firstWeekStart, lastWeekStart).stream()
                .filter(report -> report.getStatus() != ReportStatus.DRAFT)
                .sorted(Comparator.comparing(Report::getWeekStart).reversed()
                        .thenComparing(report -> report.getUser().getFullName()))
                .toList();

        text.append("\n# Reports\n");
        if (reports.isEmpty()) {
            text.append("No submitted reports in this period.\n");
        }
        for (Report report : reports) {
            appendReport(text, report);
        }
        return text.toString();
    }

    private void appendReport(StringBuilder text, Report report) {
        text.append("\n## Week starting ").append(report.getWeekStart())
                .append(" | ").append(report.getUser().getFullName())
                .append(" | ").append(report.getStatus())
                .append(" | Project: ").append(report.getProject() == null ? "none" : report.getProject().getName())
                .append('\n');

        text.append("Tasks:\n");
        for (ReportTask task : report.getTasks()) {
            text.append("- ").append(task.getName())
                    .append(" (").append(task.getPriority()).append(" priority, ").append(task.getStatus())
                    .append(", planned ").append(task.getPlannedPct()).append("% / actual ").append(task.getActualPct()).append('%')
                    .append(", planned ").append(hours(task.getPlannedHours()))
                    .append(" / spent ").append(hours(task.getSpentHours())).append(')');
            if (hasText(task.getOutput())) {
                text.append(" Output: ").append(task.getOutput());
            }
            text.append('\n');
        }

        text.append("Planned for next week: ").append(String.join("; ", report.getNextWeekTasks())).append('\n');
        text.append("Blockers: ").append(items(report.getBlockers())).append('\n');
        text.append("Achievements: ").append(items(report.getAchievements())).append('\n');
        text.append("Hours by type: ").append(report.getHoursByType().entrySet().stream()
                .map(entry -> entry.getKey() + " " + hours(entry.getValue()))
                .collect(Collectors.joining(", "))).append('\n');
        if (hasText(report.getNotes())) {
            text.append("Notes: ").append(report.getNotes()).append('\n');
        }
    }

    /** "*KEY*" marks the item the member flagged as the key blocker or achievement of the week. */
    private static String items(List<ReportItem> items) {
        if (items.isEmpty()) {
            return "none";
        }
        return items.stream()
                .map(item -> (item.isKey() ? "*KEY* " : "") + item.getDescription())
                .collect(Collectors.joining("; "));
    }

    private static String hours(BigDecimal hours) {
        return hours.stripTrailingZeros().toPlainString() + "h";
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
