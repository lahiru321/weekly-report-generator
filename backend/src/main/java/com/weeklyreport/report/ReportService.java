package com.weeklyreport.report;

import com.weeklyreport.common.ApiException;
import com.weeklyreport.common.PageResponse;
import com.weeklyreport.common.WeekUtils;
import com.weeklyreport.project.ProjectRepository;
import com.weeklyreport.report.dto.ReportDetailResponse;
import com.weeklyreport.report.dto.ReportItemDto;
import com.weeklyreport.report.dto.ReportPermissions;
import com.weeklyreport.report.dto.ReportRequest;
import com.weeklyreport.report.dto.ReportSummaryResponse;
import com.weeklyreport.report.dto.ReportVersionResponse;
import com.weeklyreport.security.AuthUser;
import com.weeklyreport.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Reading, creating and editing report content. Status changes live in ReportWorkflowService. */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ReportRepository reportRepository;
    private final ReportVersionRepository versionRepository;
    private final ReviewActionRepository reviewActionRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ReportAccessPolicy accessPolicy;
    private final ReportMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<ReportSummaryResponse> search(ReportFilter filter, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "weekStart").and(Sort.by("user.fullName")));

        return PageResponse.from(
                reportRepository.findAll(ReportSpecifications.matching(filter), pageable).map(mapper::toSummary));
    }

    @Transactional(readOnly = true)
    public ReportDetailResponse getDetail(AuthUser user, Long reportId) {
        Report report = findReport(reportId);
        accessPolicy.assertCanView(user, report);
        return toDetail(user, report);
    }

    @Transactional(readOnly = true)
    public ReportDetailResponse getMineForWeek(AuthUser user, LocalDate date) {
        Report report = reportRepository.findByUserIdAndWeekStart(user.id(), WeekUtils.startOfWeek(date))
                .orElseThrow(() -> ApiException.notFound("No report for this week yet"));
        return toDetail(user, report);
    }

    @Transactional(readOnly = true)
    public List<ReportVersionResponse> getVersions(AuthUser user, Long reportId) {
        Report report = findReport(reportId);
        accessPolicy.assertCanView(user, report);

        List<ReviewAction> reviews = reviewActionRepository.findByReportIdOrderByCreatedAtDesc(reportId);
        return versionRepository.findByReportIdOrderByVersionNoDesc(reportId).stream()
                .map(version -> mapper.toVersionResponse(version, reviews))
                .toList();
    }

    @Transactional
    public Long create(AuthUser user, ReportRequest request) {
        LocalDate weekStart = WeekUtils.startOfWeek(request.weekStart());
        assertWeekAvailable(user, weekStart);

        Report report = new Report();
        report.setUser(userRepository.getReferenceById(user.id()));
        report.setWeekStart(weekStart);
        report.setWeekEnd(WeekUtils.endOfWeek(weekStart));
        applyContent(report, request);

        return reportRepository.save(report).getId();
    }

    @Transactional
    public void update(AuthUser user, Long reportId, ReportRequest request) {
        Report report = findReport(reportId);
        accessPolicy.assertOwner(user, report);
        if (!ReportWorkflowService.isEditable(report.getStatus())) {
            throw ApiException.conflict("Only Draft or Needs Correction reports can be edited");
        }

        LocalDate weekStart = WeekUtils.startOfWeek(request.weekStart());
        if (!weekStart.equals(report.getWeekStart())) {
            if (report.getCurrentVersion() > 0) {
                throw ApiException.badRequest("The week of a submitted report cannot be changed");
            }
            assertWeekAvailable(user, weekStart);
            report.setWeekStart(weekStart);
            report.setWeekEnd(WeekUtils.endOfWeek(weekStart));
        }

        applyContent(report, request);
        report.setUpdatedAt(Instant.now());
    }

    Report findReport(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> ApiException.notFound("Report not found"));
    }

    private ReportDetailResponse toDetail(AuthUser user, Report report) {
        List<ReviewAction> reviews = reviewActionRepository.findByReportIdOrderByCreatedAtDesc(report.getId());
        return mapper.toDetail(report, reviews, permissionsFor(user, report));
    }

    private ReportPermissions permissionsFor(AuthUser user, Report report) {
        boolean owner = accessPolicy.isOwner(user, report);
        boolean editable = owner && ReportWorkflowService.isEditable(report.getStatus());
        boolean reviewable = !owner && user.isManagerOrAdmin() && ReportWorkflowService.isReviewable(report.getStatus());
        return new ReportPermissions(editable, editable, reviewable);
    }

    private void applyContent(Report report, ReportRequest request) {
        assertAtMostOneKey(request.blockers(), "blocker");
        assertAtMostOneKey(request.achievements(), "achievement");

        report.setProject(request.projectId() == null ? null
                : projectRepository.findById(request.projectId())
                        .orElseThrow(() -> ApiException.badRequest("Project not found")));
        mapper.applyRequest(report, request);
    }

    private void assertWeekAvailable(AuthUser user, LocalDate weekStart) {
        if (weekStart.isAfter(WeekUtils.currentWeekStart())) {
            throw ApiException.badRequest("You cannot create a report for a future week");
        }
        if (reportRepository.existsByUserIdAndWeekStart(user.id(), weekStart)) {
            throw ApiException.conflict("You already have a report for this week");
        }
    }

    private void assertAtMostOneKey(List<ReportItemDto> items, String label) {
        if (items.stream().filter(ReportItemDto::isKey).count() > 1) {
            throw ApiException.badRequest("Only one " + label + " can be flagged as the key one");
        }
    }
}
