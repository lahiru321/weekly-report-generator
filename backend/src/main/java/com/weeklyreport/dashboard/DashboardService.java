package com.weeklyreport.dashboard;

import com.weeklyreport.common.WeekUtils;
import com.weeklyreport.dashboard.dto.ActivityItem;
import com.weeklyreport.dashboard.dto.DashboardCharts;
import com.weeklyreport.dashboard.dto.DashboardSummary;
import com.weeklyreport.dashboard.dto.MemberWeekStatus;
import com.weeklyreport.dashboard.dto.SectionEntry;
import com.weeklyreport.report.Report;
import com.weeklyreport.report.ReportItem;
import com.weeklyreport.report.ReportRepository;
import com.weeklyreport.report.ReportStatus;
import com.weeklyreport.report.ReportTask;
import com.weeklyreport.report.ReportVersionRepository;
import com.weeklyreport.report.ReviewActionRepository;
import com.weeklyreport.report.TaskType;
import com.weeklyreport.report.dto.ReportItemDto;
import com.weeklyreport.user.Role;
import com.weeklyreport.user.User;
import com.weeklyreport.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Team-wide numbers for managers. Reports for the selected period are loaded once and
 * aggregated in Java, which keeps the logic easy to read at this team size.
 * Draft content is never included: drafts stay private until submitted.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    static final String NOT_STARTED = "NOT_STARTED";
    private static final int MAX_WEEKS = 26;
    private static final int MAX_ACTIVITY_ITEMS = 50;

    private final ReportRepository reportRepository;
    private final ReportVersionRepository versionRepository;
    private final ReviewActionRepository reviewActionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardSummary summary(LocalDate date) {
        LocalDate weekStart = WeekUtils.startOfWeek(date);
        List<MemberWeekStatus> team = teamStatus(weekStart);

        int submitted = (int) team.stream().filter(MemberWeekStatus::hasSubmitted).count();
        int submittedLate = (int) team.stream().filter(member -> member.hasSubmitted() && member.late()).count();
        int overdue = (int) team.stream().filter(member -> !member.hasSubmitted() && member.late()).count();
        int openBlockers = team.stream().mapToInt(MemberWeekStatus::blockerCount).sum();
        double complianceRate = team.isEmpty() ? 0 : (double) submitted / team.size();

        return new DashboardSummary(
                weekStart,
                WeekUtils.endOfWeek(weekStart),
                team.size(),
                submitted,
                submitted - submittedLate,
                submittedLate,
                team.size() - submitted,
                overdue,
                complianceRate,
                reportRepository.countByStatus(ReportStatus.NEEDS_CORRECTION),
                reportRepository.countByStatus(ReportStatus.SUBMITTED),
                openBlockers);
    }

    /** One row per active team member for the given week, including members who haven't started. */
    @Transactional(readOnly = true)
    public List<MemberWeekStatus> teamStatus(LocalDate date) {
        LocalDate weekStart = WeekUtils.startOfWeek(date);
        List<Report> reports = reportRepository.findByWeekStartBetween(weekStart, weekStart);
        Map<Long, Report> reportByUser = reports.stream()
                .collect(Collectors.toMap(report -> report.getUser().getId(), report -> report));
        Map<Long, Instant> firstSubmitted = versionRepository.firstSubmissionTimes(reports);
        Instant deadline = WeekUtils.deadlineFor(weekStart);
        boolean deadlinePassed = Instant.now().isAfter(deadline);

        return userRepository.findByRoleAndActiveTrueOrderByFullName(Role.MEMBER).stream()
                .map(member -> {
                    Report report = reportByUser.get(member.getId());
                    if (report == null) {
                        return new MemberWeekStatus(member.getId(), member.getFullName(), NOT_STARTED,
                                null, null, deadlinePassed, 0, 0);
                    }

                    Instant firstSubmittedAt = firstSubmitted.get(report.getId());
                    boolean late = firstSubmittedAt != null ? firstSubmittedAt.isAfter(deadline) : deadlinePassed;
                    // Managers can see that a draft exists, but not open it
                    boolean visible = report.getStatus() != ReportStatus.DRAFT;

                    return new MemberWeekStatus(member.getId(), member.getFullName(), report.getStatus().name(),
                            visible ? report.getId() : null, firstSubmittedAt, late,
                            visible ? report.countCompletedTasks() : 0,
                            visible ? report.getBlockers().size() : 0);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardCharts charts(int weeks) {
        int weekCount = Math.min(Math.max(weeks, 1), MAX_WEEKS);
        LocalDate lastWeek = WeekUtils.currentWeekStart();
        LocalDate firstWeek = lastWeek.minusWeeks(weekCount - 1L);

        List<User> members = userRepository.findByRoleAndActiveTrueOrderByFullName(Role.MEMBER);
        List<Report> reports = reportRepository.findByWeekStartBetween(firstWeek, lastWeek);
        List<Report> submitted = reports.stream().filter(report -> report.getCurrentVersion() > 0).toList();

        return new DashboardCharts(
                members.stream().map(member -> new DashboardCharts.MemberRef(member.getId(), member.getFullName())).toList(),
                tasksCompletedTrend(members, submitted, firstWeek, lastWeek),
                statusByMember(members, reports, weekCount),
                workloadByProject(submitted),
                timeByTaskType(submitted));
    }

    /** Latest submissions and review decisions, merged and sorted newest first. */
    @Transactional(readOnly = true)
    public List<ActivityItem> activity(int limit) {
        int size = Math.min(Math.max(limit, 1), MAX_ACTIVITY_ITEMS);
        PageRequest firstPage = PageRequest.of(0, size);
        List<ActivityItem> items = new ArrayList<>();

        versionRepository.findAllByOrderBySubmittedAtDesc(firstPage).forEach(version -> {
            Report report = version.getReport();
            items.add(new ActivityItem(
                    version.getVersionNo() == 1 ? "SUBMITTED" : "RESUBMITTED",
                    report.getId(), report.getUser().getFullName(), report.getWeekStart(), version.getVersionNo(),
                    report.getUser().getFullName(), null, version.getSubmittedAt()));
        });

        reviewActionRepository.findAllByOrderByCreatedAtDesc(firstPage).forEach(review -> {
            Report report = review.getReport();
            items.add(new ActivityItem(
                    review.getAction().name(),
                    report.getId(), report.getUser().getFullName(), report.getWeekStart(),
                    review.getVersion().getVersionNo(),
                    review.getReviewer().getFullName(), review.getComment(), review.getCreatedAt()));
        });

        return items.stream()
                .sorted(Comparator.comparing(ActivityItem::at).reversed())
                .limit(size)
                .toList();
    }

    /** One section (e.g. blockers) of every submitted report for a week, for side-by-side comparison. */
    @Transactional(readOnly = true)
    public List<SectionEntry> section(LocalDate date, ReportSection section) {
        LocalDate weekStart = WeekUtils.startOfWeek(date);
        return reportRepository.findByWeekStartBetween(weekStart, weekStart).stream()
                .filter(report -> report.getStatus() != ReportStatus.DRAFT)
                .sorted(Comparator.comparing(report -> report.getUser().getFullName()))
                .map(report -> new SectionEntry(report.getId(), report.getUser().getId(),
                        report.getUser().getFullName(), report.getStatus(), itemsFor(report, section)))
                .toList();
    }

    private List<DashboardCharts.WeekPoint> tasksCompletedTrend(List<User> members, List<Report> submitted,
                                                                LocalDate firstWeek, LocalDate lastWeek) {
        List<DashboardCharts.WeekPoint> points = new ArrayList<>();
        for (LocalDate week = firstWeek; !week.isAfter(lastWeek); week = week.plusWeeks(1)) {
            Map<Long, Integer> byMember = new LinkedHashMap<>();
            members.forEach(member -> byMember.put(member.getId(), 0));
            for (Report report : submitted) {
                if (report.getWeekStart().equals(week)) {
                    byMember.merge(report.getUser().getId(), report.countCompletedTasks(), Integer::sum);
                }
            }
            int total = byMember.values().stream().mapToInt(Integer::intValue).sum();
            points.add(new DashboardCharts.WeekPoint(week, total, byMember));
        }
        return points;
    }

    private List<DashboardCharts.MemberStatusCounts> statusByMember(List<User> members, List<Report> reports, int weekCount) {
        Map<Long, List<Report>> reportsByUser = reports.stream()
                .collect(Collectors.groupingBy(report -> report.getUser().getId()));

        return members.stream()
                .map(member -> {
                    List<Report> own = reportsByUser.getOrDefault(member.getId(), List.of());
                    return new DashboardCharts.MemberStatusCounts(
                            member.getId(),
                            member.getFullName(),
                            count(own, ReportStatus.APPROVED),
                            count(own, ReportStatus.SUBMITTED),
                            count(own, ReportStatus.NEEDS_CORRECTION),
                            count(own, ReportStatus.DRAFT),
                            weekCount - own.size());
                })
                .toList();
    }

    private List<DashboardCharts.ProjectWorkload> workloadByProject(List<Report> submitted) {
        Map<String, DashboardCharts.ProjectWorkload> byProject = new HashMap<>();
        for (Report report : submitted) {
            String name = report.getProject() == null ? "No project" : report.getProject().getName();
            BigDecimal spentHours = report.getTasks().stream()
                    .map(ReportTask::getSpentHours)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            byProject.merge(name,
                    new DashboardCharts.ProjectWorkload(name, 1, report.getTasks().size(), spentHours),
                    (a, b) -> new DashboardCharts.ProjectWorkload(name, a.reports() + b.reports(),
                            a.tasks() + b.tasks(), a.spentHours().add(b.spentHours())));
        }
        return byProject.values().stream()
                .sorted(Comparator.comparing(DashboardCharts.ProjectWorkload::spentHours).reversed())
                .toList();
    }

    private List<DashboardCharts.TaskTypeHours> timeByTaskType(List<Report> submitted) {
        Map<TaskType, BigDecimal> totals = new EnumMap<>(TaskType.class);
        submitted.forEach(report ->
                report.getHoursByType().forEach((type, hours) -> totals.merge(type, hours, BigDecimal::add)));

        return totals.entrySet().stream()
                .map(entry -> new DashboardCharts.TaskTypeHours(entry.getKey(), entry.getValue()))
                .toList();
    }

    private List<ReportItemDto> itemsFor(Report report, ReportSection section) {
        return switch (section) {
            case BLOCKERS -> toItemDtos(report.getBlockers());
            case ACHIEVEMENTS -> toItemDtos(report.getAchievements());
            case NEXT_WEEK -> report.getNextWeekTasks().stream().map(task -> new ReportItemDto(task, false)).toList();
        };
    }

    private List<ReportItemDto> toItemDtos(List<ReportItem> items) {
        return items.stream().map(item -> new ReportItemDto(item.getDescription(), item.isKey())).toList();
    }

    private static int count(List<Report> reports, ReportStatus status) {
        return (int) reports.stream().filter(report -> report.getStatus() == status).count();
    }
}
