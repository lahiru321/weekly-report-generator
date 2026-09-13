package com.weeklyreport.dashboard;

import com.weeklyreport.dashboard.dto.ActivityItem;
import com.weeklyreport.dashboard.dto.DashboardCharts;
import com.weeklyreport.dashboard.dto.DashboardSummary;
import com.weeklyreport.dashboard.dto.MemberWeekStatus;
import com.weeklyreport.dashboard.dto.SectionEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Manager dashboard data. /api/dashboard/** is restricted to MANAGER and ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public DashboardSummary summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week) {
        return dashboardService.summary(week == null ? LocalDate.now() : week);
    }

    @GetMapping("/team-status")
    public List<MemberWeekStatus> teamStatus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week) {
        return dashboardService.teamStatus(week == null ? LocalDate.now() : week);
    }

    @GetMapping("/charts")
    public DashboardCharts charts(@RequestParam(defaultValue = "8") int weeks) {
        return dashboardService.charts(weeks);
    }

    @GetMapping("/activity")
    public List<ActivityItem> activity(@RequestParam(defaultValue = "15") int limit) {
        return dashboardService.activity(limit);
    }

    @GetMapping("/sections")
    public List<SectionEntry> section(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
            @RequestParam ReportSection section) {
        return dashboardService.section(week == null ? LocalDate.now() : week, section);
    }
}
