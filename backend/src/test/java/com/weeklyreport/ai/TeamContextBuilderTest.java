package com.weeklyreport.ai;

import com.weeklyreport.dashboard.DashboardService;
import com.weeklyreport.dashboard.dto.MemberWeekStatus;
import com.weeklyreport.report.Report;
import com.weeklyreport.report.ReportItem;
import com.weeklyreport.report.ReportRepository;
import com.weeklyreport.report.ReportStatus;
import com.weeklyreport.report.ReportTask;
import com.weeklyreport.report.TaskPriority;
import com.weeklyreport.report.TaskStatus;
import com.weeklyreport.report.TaskType;
import com.weeklyreport.user.Role;
import com.weeklyreport.user.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** What report data is sent to the AI, and what is kept out of it. */
class TeamContextBuilderTest {

    private static final LocalDate WEEK = LocalDate.of(2026, 9, 7);

    private final ReportRepository reportRepository = mock(ReportRepository.class);
    private final DashboardService dashboardService = mock(DashboardService.class);
    private final TeamContextBuilder builder = new TeamContextBuilder(reportRepository, dashboardService);

    @Test
    void includesSubmittedReportContentAndMarksKeyItems() {
        Report report = report(user(1L, "Ava Patel", "ava@demo.com"), ReportStatus.SUBMITTED, "Build login page");
        report.getBlockers().add(new ReportItem("Waiting on client API keys", true));
        report.getAchievements().add(new ReportItem("Shipped login flow", false));
        report.getHoursByType().put(TaskType.DEVELOPMENT, new BigDecimal("28.00"));
        givenReports(report);

        String text = builder.build(WEEK, 4);

        assertThat(text).contains(
                "Ava Patel | SUBMITTED",
                "Build login page (HIGH priority, COMPLETED",
                "Blockers: *KEY* Waiting on client API keys",
                "Achievements: Shipped login flow",
                "DEVELOPMENT 28h");
    }

    @Test
    void leavesOutDraftsAndPersonalDetails() {
        User ben = user(2L, "Ben Carter", "ben@demo.com");
        givenReports(
                report(ben, ReportStatus.APPROVED, "Visible task"),
                report(ben, ReportStatus.DRAFT, "Private draft task"));

        String text = builder.build(WEEK, 4);

        assertThat(text).contains("Visible task");
        assertThat(text).doesNotContain("Private draft task", "ben@demo.com");
    }

    private void givenReports(Report... reports) {
        when(reportRepository.findByWeekStartBetween(any(), any())).thenReturn(List.of(reports));
        when(dashboardService.teamStatus(any())).thenReturn(List.of(
                new MemberWeekStatus(1L, "Ava Patel", "SUBMITTED", 10L, Instant.now(), false, 1, 1)));
    }

    private static Report report(User user, ReportStatus status, String taskName) {
        Report report = new Report();
        report.setUser(user);
        report.setStatus(status);
        report.setWeekStart(WEEK);
        report.setWeekEnd(WEEK.plusDays(6));
        report.getTasks().add(new ReportTask(taskName, TaskPriority.HIGH, 100, 100, TaskStatus.COMPLETED,
                new BigDecimal("5"), new BigDecimal("6"), null));
        return report;
    }

    private static User user(Long id, String name, String email) {
        User user = new User();
        user.setId(id);
        user.setFullName(name);
        user.setEmail(email);
        user.setRole(Role.MEMBER);
        return user;
    }
}
