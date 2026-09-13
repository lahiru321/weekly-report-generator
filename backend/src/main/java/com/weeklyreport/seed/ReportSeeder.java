package com.weeklyreport.seed;

import com.weeklyreport.common.WeekUtils;
import com.weeklyreport.project.Project;
import com.weeklyreport.report.Report;
import com.weeklyreport.report.ReportItem;
import com.weeklyreport.report.ReportMapper;
import com.weeklyreport.report.ReportRepository;
import com.weeklyreport.report.ReportStatus;
import com.weeklyreport.report.ReportTask;
import com.weeklyreport.report.ReportVersion;
import com.weeklyreport.report.ReportVersionRepository;
import com.weeklyreport.report.ReviewAction;
import com.weeklyreport.report.ReviewActionRepository;
import com.weeklyreport.report.ReviewActionType;
import com.weeklyreport.report.TaskPriority;
import com.weeklyreport.report.TaskStatus;
import com.weeklyreport.report.TaskType;
import com.weeklyreport.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Creates six weeks of realistic reports for the demo members, covering every status,
 * late submissions, missing reports and full correction cycles with multiple versions.
 */
@Component
@RequiredArgsConstructor
public class ReportSeeder {

    enum Scenario {
        MISSING, DRAFT, SUBMITTED, SUBMITTED_LATE, APPROVED, APPROVED_LATE,
        NEEDS_CORRECTION, RESUBMITTED, APPROVED_AFTER_CORRECTION
    }

    private static final Map<String, List<String>> TASKS_BY_PROJECT = Map.of(
            "Client A Portal", List.of("Build login page", "Fix checkout bug", "Add order history API",
                    "Improve page load time", "Write E2E tests for cart", "Prepare client demo"),
            "Internal Tooling", List.of("Automate release notes", "Add CI pipeline caching", "Build Slack alert bot",
                    "Upgrade build scripts", "Create deploy dashboard"),
            "R&D", List.of("Evaluate vector search", "Prototype offline mode", "Benchmark new ORM",
                    "Spike on WebSockets", "Write research summary"),
            "Marketing Site", List.of("Build new landing page", "Fix SEO audit issues", "Create blog template",
                    "Set up pricing page A/B test", "Optimize images"));

    private static final List<String> BLOCKERS = List.of(
            "Waiting for API credentials from the client",
            "Staging environment was down for a day",
            "Unclear requirements for the export feature",
            "Code review backlog slowed down merges",
            "Dependency upgrade broke the build");

    private static final List<String> ACHIEVEMENTS = List.of(
            "Shipped the feature ahead of schedule",
            "Reduced API response time by 30%",
            "Closed 12 bugs from the backlog",
            "Positive feedback from the client demo",
            "Onboarded and mentored a new teammate");

    private static final List<String> NEXT_WEEK = List.of(
            "Finish remaining tests",
            "Start payment provider integration",
            "Pair with QA on regression testing",
            "Refactor the data access layer",
            "Prepare the sprint demo");

    private static final List<String> CORRECTION_COMMENTS = List.of(
            "Please add the deliverable for each completed task.",
            "Time spent doesn't match the hours breakdown. Please update it.",
            "Please flag the key blocker and add more detail about its impact.");

    /** Rows = members (in order), columns = weeks from 5 weeks ago up to the current week. */
    private static final Scenario[][] PLAN = {
            {Scenario.APPROVED, Scenario.APPROVED, Scenario.APPROVED, Scenario.APPROVED, Scenario.APPROVED, Scenario.DRAFT},
            {Scenario.APPROVED, Scenario.APPROVED, Scenario.APPROVED_AFTER_CORRECTION, Scenario.APPROVED, Scenario.SUBMITTED, Scenario.SUBMITTED},
            {Scenario.APPROVED, Scenario.APPROVED, Scenario.APPROVED, Scenario.APPROVED_LATE, Scenario.NEEDS_CORRECTION, Scenario.MISSING},
            {Scenario.APPROVED, Scenario.APPROVED, Scenario.APPROVED, Scenario.APPROVED, Scenario.RESUBMITTED, Scenario.DRAFT},
            {Scenario.APPROVED, Scenario.MISSING, Scenario.APPROVED, Scenario.APPROVED, Scenario.SUBMITTED_LATE, Scenario.MISSING},
    };

    private final ReportRepository reportRepository;
    private final ReportVersionRepository versionRepository;
    private final ReviewActionRepository reviewActionRepository;
    private final ReportMapper mapper;
    private final Random random = new Random(42);

    /** @param members members in PLAN order, each with the project they mostly work on */
    public void seed(User reviewer, List<Map.Entry<User, Project>> members) {
        LocalDate currentWeek = WeekUtils.currentWeekStart();

        for (int m = 0; m < members.size() && m < PLAN.length; m++) {
            User member = members.get(m).getKey();
            Project project = members.get(m).getValue();

            for (int w = 0; w < PLAN[m].length; w++) {
                LocalDate weekStart = currentWeek.minusWeeks(PLAN[m].length - 1 - w);
                seedWeek(PLAN[m][w], member, project, reviewer, weekStart);
            }
        }
    }

    private void seedWeek(Scenario scenario, User member, Project project, User reviewer, LocalDate weekStart) {
        if (scenario == Scenario.MISSING) {
            return;
        }

        Report report = buildReport(member, project, weekStart, scenario == Scenario.DRAFT);
        reportRepository.save(report);

        Instant onTime = at(weekStart.plusDays(4), 17);     // Friday afternoon
        Instant late = at(weekStart.plusDays(8), 11);       // Tuesday of the following week
        Instant reviewDay = at(weekStart.plusDays(7), 10);  // Monday morning
        String correction = CORRECTION_COMMENTS.get(random.nextInt(CORRECTION_COMMENTS.size()));

        switch (scenario) {
            case DRAFT -> { }
            case SUBMITTED -> submit(report, onTime);
            case SUBMITTED_LATE -> submit(report, late);
            case APPROVED -> review(report, submit(report, onTime), reviewer, ReviewActionType.APPROVED, null, reviewDay);
            case APPROVED_LATE -> review(report, submit(report, late), reviewer, ReviewActionType.APPROVED,
                    "Approved, but please submit by Friday next time.", at(weekStart.plusDays(9), 10));
            case NEEDS_CORRECTION -> review(report, submit(report, onTime), reviewer,
                    ReviewActionType.CHANGES_REQUESTED, correction, reviewDay);
            case RESUBMITTED -> {
                review(report, submit(report, onTime), reviewer, ReviewActionType.CHANGES_REQUESTED, correction, reviewDay);
                applyCorrection(report);
                submit(report, at(weekStart.plusDays(7), 15));
            }
            case APPROVED_AFTER_CORRECTION -> {
                review(report, submit(report, onTime), reviewer, ReviewActionType.CHANGES_REQUESTED, correction, reviewDay);
                applyCorrection(report);
                ReportVersion secondVersion = submit(report, at(weekStart.plusDays(7), 15));
                review(report, secondVersion, reviewer, ReviewActionType.APPROVED, "Thanks for the update.",
                        at(weekStart.plusDays(8), 10));
            }
            case MISSING -> throw new IllegalStateException("unreachable");
        }
    }

    private Report buildReport(User member, Project project, LocalDate weekStart, boolean draft) {
        Report report = new Report();
        report.setUser(member);
        report.setProject(project);
        report.setWeekStart(weekStart);
        report.setWeekEnd(WeekUtils.endOfWeek(weekStart));
        report.setCreatedAt(at(weekStart, 9));
        report.setUpdatedAt(at(weekStart, 9));

        List<String> taskNames = new ArrayList<>(TASKS_BY_PROJECT.get(project.getName()));
        Collections.shuffle(taskNames, random);
        int taskCount = draft ? 2 : 3 + random.nextInt(2);
        for (int i = 0; i < taskCount; i++) {
            report.getTasks().add(buildTask(taskNames.get(i)));
        }

        report.getNextWeekTasks().addAll(pick(NEXT_WEEK, 2));

        List<String> blockers = pick(BLOCKERS, random.nextInt(3));
        for (int i = 0; i < blockers.size(); i++) {
            report.getBlockers().add(new ReportItem(blockers.get(i), i == 0));
        }
        List<String> achievements = pick(ACHIEVEMENTS, 1 + random.nextInt(2));
        for (int i = 0; i < achievements.size(); i++) {
            report.getAchievements().add(new ReportItem(achievements.get(i), i == 0));
        }

        report.getHoursByType().put(TaskType.DEVELOPMENT, hours(18, 28));
        report.getHoursByType().put(TaskType.TESTING, hours(3, 8));
        report.getHoursByType().put(TaskType.MEETINGS, hours(4, 9));
        report.getHoursByType().put(TaskType.DOCUMENTATION, hours(1, 4));
        return report;
    }

    private ReportTask buildTask(String name) {
        int roll = random.nextInt(100);
        TaskStatus status = roll < 60 ? TaskStatus.COMPLETED
                : roll < 85 ? TaskStatus.IN_PROGRESS
                : roll < 95 ? TaskStatus.BLOCKED
                : TaskStatus.NOT_STARTED;
        int actualPct = switch (status) {
            case COMPLETED -> 100;
            case IN_PROGRESS -> 30 + random.nextInt(6) * 10;
            case BLOCKED -> 10 + random.nextInt(3) * 10;
            case NOT_STARTED -> 0;
        };
        BigDecimal planned = BigDecimal.valueOf(4 + random.nextInt(10));
        BigDecimal spent = planned.add(BigDecimal.valueOf(random.nextInt(7) - 3)).max(BigDecimal.ONE);
        TaskPriority priority = TaskPriority.values()[random.nextInt(TaskPriority.values().length)];
        String output = status == TaskStatus.COMPLETED ? "Merged PR and deployed to staging" : null;

        return new ReportTask(name, priority, 100, actualPct, status, planned, spent, output);
    }

    /** Simulates the member fixing their report after a manager asked for changes. */
    private void applyCorrection(Report report) {
        for (ReportTask task : report.getTasks()) {
            if (task.getOutput() == null) {
                task.setOutput("Draft PR opened, details added after review");
            }
        }
        if (!report.getBlockers().isEmpty()) {
            ReportItem key = report.getBlockers().get(0);
            key.setDescription(key.getDescription() + " (impact: 1 day delay)");
        }
    }

    private ReportVersion submit(Report report, Instant submittedAt) {
        Instant when = capToNow(submittedAt);
        report.setCurrentVersion(report.getCurrentVersion() + 1);
        report.setStatus(ReportStatus.SUBMITTED);
        report.setSubmittedAt(when);
        report.setUpdatedAt(when);

        ReportVersion version = new ReportVersion();
        version.setReport(report);
        version.setVersionNo(report.getCurrentVersion());
        version.setContent(mapper.toJson(mapper.toContent(report)));
        version.setSubmittedAt(when);
        return versionRepository.save(version);
    }

    private void review(Report report, ReportVersion version, User reviewer, ReviewActionType action,
                        String comment, Instant reviewedAt) {
        Instant when = capToNow(reviewedAt);
        ReviewAction review = new ReviewAction();
        review.setReport(report);
        review.setVersion(version);
        review.setReviewer(reviewer);
        review.setAction(action);
        review.setComment(comment);
        review.setCreatedAt(when);
        reviewActionRepository.save(review);

        report.setStatus(action == ReviewActionType.APPROVED ? ReportStatus.APPROVED : ReportStatus.NEEDS_CORRECTION);
        report.setUpdatedAt(when);
    }

    private List<String> pick(List<String> source, int count) {
        List<String> copy = new ArrayList<>(source);
        Collections.shuffle(copy, random);
        return new ArrayList<>(copy.subList(0, Math.min(count, copy.size())));
    }

    private BigDecimal hours(int min, int max) {
        return BigDecimal.valueOf(min + random.nextInt(max - min + 1));
    }

    private static Instant at(LocalDate date, int hour) {
        return date.atTime(hour, 0).atZone(ZoneId.systemDefault()).toInstant();
    }

    // Seed timestamps for the current week must never be in the future
    private static Instant capToNow(Instant instant) {
        Instant now = Instant.now().minusSeconds(60);
        return instant.isAfter(now) ? now : instant;
    }
}
