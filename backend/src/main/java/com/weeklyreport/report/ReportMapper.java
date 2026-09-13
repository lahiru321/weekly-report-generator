package com.weeklyreport.report;

import com.weeklyreport.project.Project;
import com.weeklyreport.report.dto.ReportContent;
import com.weeklyreport.report.dto.ReportDetailResponse;
import com.weeklyreport.report.dto.ReportItemDto;
import com.weeklyreport.report.dto.ReportPermissions;
import com.weeklyreport.report.dto.ReportRequest;
import com.weeklyreport.report.dto.ReportSummaryResponse;
import com.weeklyreport.report.dto.ReportVersionResponse;
import com.weeklyreport.report.dto.ReviewResponse;
import com.weeklyreport.report.dto.TaskDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.TreeMap;

import static com.weeklyreport.common.TextUtils.trimToNull;

/** Converts between report entities, request bodies, API responses and version JSON. */
@Component
@RequiredArgsConstructor
public class ReportMapper {

    private final ObjectMapper objectMapper;

    /** Replaces the report's content with the request's content (project is set by the service). */
    public void applyRequest(Report report, ReportRequest request) {
        report.getTasks().clear();
        for (TaskDto task : request.tasks()) {
            report.getTasks().add(new ReportTask(task.name().trim(), task.priority(), task.plannedPct(),
                    task.actualPct(), task.status(), task.plannedHours(), task.spentHours(), trimToNull(task.output())));
        }

        report.getNextWeekTasks().clear();
        request.nextWeekTasks().forEach(task -> report.getNextWeekTasks().add(task.trim()));

        replaceItems(report.getBlockers(), request.blockers());
        replaceItems(report.getAchievements(), request.achievements());

        report.getHoursByType().clear();
        request.hoursByType().forEach((type, hours) -> {
            if (hours.signum() > 0) {
                report.getHoursByType().put(type, hours);
            }
        });

        report.setNotes(trimToNull(request.notes()));
        report.setLinks(trimToNull(request.links()));
    }

    public ReportContent toContent(Report report) {
        Project project = report.getProject();
        return new ReportContent(
                project == null ? null : project.getId(),
                project == null ? null : project.getName(),
                report.getTasks().stream().map(this::toTaskDto).toList(),
                List.copyOf(report.getNextWeekTasks()),
                report.getBlockers().stream().map(this::toItemDto).toList(),
                report.getAchievements().stream().map(this::toItemDto).toList(),
                new TreeMap<>(report.getHoursByType()),
                report.getNotes(),
                report.getLinks());
    }

    public ReportSummaryResponse toSummary(Report report) {
        Project project = report.getProject();
        int completedTasks = (int) report.getTasks().stream()
                .filter(task -> task.getStatus() == TaskStatus.COMPLETED)
                .count();

        return new ReportSummaryResponse(
                report.getId(),
                report.getUser().getId(),
                report.getUser().getFullName(),
                project == null ? null : project.getId(),
                project == null ? null : project.getName(),
                report.getWeekStart(),
                report.getWeekEnd(),
                report.getStatus(),
                report.getCurrentVersion(),
                report.getTasks().size(),
                completedTasks,
                report.getBlockers().size(),
                report.getSubmittedAt(),
                report.getUpdatedAt());
    }

    /** @param reviews all reviews of this report, newest first */
    public ReportDetailResponse toDetail(Report report, List<ReviewAction> reviews, ReportPermissions permissions) {
        List<ReviewResponse> reviewHistory = reviews.stream().map(this::toReviewResponse).toList();

        return new ReportDetailResponse(
                report.getId(),
                report.getUser().getId(),
                report.getUser().getFullName(),
                report.getWeekStart(),
                report.getWeekEnd(),
                report.getStatus(),
                report.getCurrentVersion(),
                report.getSubmittedAt(),
                report.getCreatedAt(),
                report.getUpdatedAt(),
                toContent(report),
                reviewHistory.isEmpty() ? null : reviewHistory.get(0),
                reviewHistory,
                permissions);
    }

    public ReportVersionResponse toVersionResponse(ReportVersion version, List<ReviewAction> reviews) {
        List<ReviewResponse> reviewsForVersion = reviews.stream()
                .filter(review -> review.getVersion().getId().equals(version.getId()))
                .map(this::toReviewResponse)
                .toList();

        return new ReportVersionResponse(version.getId(), version.getVersionNo(), version.getSubmittedAt(),
                fromJson(version.getContent()), reviewsForVersion);
    }

    public ReviewResponse toReviewResponse(ReviewAction review) {
        return new ReviewResponse(
                review.getId(),
                review.getVersion().getVersionNo(),
                review.getReviewer().getId(),
                review.getReviewer().getFullName(),
                review.getAction(),
                review.getComment(),
                review.getCreatedAt());
    }

    public String toJson(ReportContent content) {
        return objectMapper.writeValueAsString(content);
    }

    public ReportContent fromJson(String json) {
        return objectMapper.readValue(json, ReportContent.class);
    }

    private TaskDto toTaskDto(ReportTask task) {
        return new TaskDto(task.getName(), task.getPriority(), task.getPlannedPct(), task.getActualPct(),
                task.getStatus(), task.getPlannedHours(), task.getSpentHours(), task.getOutput());
    }

    private ReportItemDto toItemDto(ReportItem item) {
        return new ReportItemDto(item.getDescription(), item.isKey());
    }

    private void replaceItems(List<ReportItem> target, List<ReportItemDto> source) {
        target.clear();
        source.forEach(item -> target.add(new ReportItem(item.description().trim(), item.isKey())));
    }
}
