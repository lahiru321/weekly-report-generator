package com.weeklyreport.report;

import com.weeklyreport.common.ApiException;
import com.weeklyreport.security.AuthUser;
import com.weeklyreport.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static com.weeklyreport.common.TextUtils.trimToNull;

/**
 * The review cycle. Every status change goes through this class:
 *
 * <pre>
 * DRAFT ──submit──> SUBMITTED ──approve──> APPROVED
 *                      └──request changes──> NEEDS_CORRECTION ──submit──> SUBMITTED
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class ReportWorkflowService {

    private final ReportService reportService;
    private final ReportVersionRepository versionRepository;
    private final ReviewActionRepository reviewActionRepository;
    private final UserRepository userRepository;
    private final ReportAccessPolicy accessPolicy;
    private final ReportMapper mapper;

    public static boolean isEditable(ReportStatus status) {
        return status == ReportStatus.DRAFT || status == ReportStatus.NEEDS_CORRECTION;
    }

    public static boolean isReviewable(ReportStatus status) {
        return status == ReportStatus.SUBMITTED;
    }

    /** Team member submits (or resubmits) their report. A frozen copy is saved as a new version. */
    @Transactional
    public void submit(AuthUser user, Long reportId) {
        Report report = reportService.findReport(reportId);
        accessPolicy.assertOwner(user, report);
        if (!isEditable(report.getStatus())) {
            throw ApiException.conflict("Only Draft or Needs Correction reports can be submitted");
        }
        assertReadyToSubmit(report);

        ReportVersion version = new ReportVersion();
        version.setReport(report);
        version.setVersionNo(report.getCurrentVersion() + 1);
        version.setContent(mapper.toJson(mapper.toContent(report)));
        versionRepository.save(version);

        Instant now = Instant.now();
        report.setCurrentVersion(version.getVersionNo());
        report.setStatus(ReportStatus.SUBMITTED);
        report.setSubmittedAt(now);
        report.setUpdatedAt(now);
    }

    @Transactional
    public void approve(AuthUser reviewer, Long reportId, String comment) {
        review(reviewer, reportId, ReviewActionType.APPROVED, ReportStatus.APPROVED, trimToNull(comment));
    }

    @Transactional
    public void requestChanges(AuthUser reviewer, Long reportId, String comment) {
        String trimmedComment = trimToNull(comment);
        if (trimmedComment == null) {
            throw ApiException.badRequest("A comment is required when requesting changes");
        }
        review(reviewer, reportId, ReviewActionType.CHANGES_REQUESTED, ReportStatus.NEEDS_CORRECTION, trimmedComment);
    }

    private void review(AuthUser reviewer, Long reportId, ReviewActionType action, ReportStatus newStatus, String comment) {
        if (!reviewer.isManagerOrAdmin()) {
            throw ApiException.forbidden("Only managers can review reports");
        }
        Report report = reportService.findReport(reportId);
        if (accessPolicy.isOwner(reviewer, report)) {
            throw ApiException.forbidden("You cannot review your own report");
        }
        if (!isReviewable(report.getStatus())) {
            throw ApiException.conflict("Only submitted reports can be reviewed");
        }

        // The comment is attached to the version the manager is looking at
        ReportVersion version = versionRepository.findByReportIdAndVersionNo(report.getId(), report.getCurrentVersion())
                .orElseThrow(() -> new IllegalStateException("Submitted report " + reportId + " has no version snapshot"));

        ReviewAction reviewAction = new ReviewAction();
        reviewAction.setReport(report);
        reviewAction.setVersion(version);
        reviewAction.setReviewer(userRepository.getReferenceById(reviewer.id()));
        reviewAction.setAction(action);
        reviewAction.setComment(comment);
        reviewActionRepository.save(reviewAction);

        report.setStatus(newStatus);
        report.setUpdatedAt(Instant.now());
    }

    private void assertReadyToSubmit(Report report) {
        if (report.getProject() == null) {
            throw ApiException.badRequest("Choose a project before submitting");
        }
        if (report.getTasks().isEmpty()) {
            throw ApiException.badRequest("Add at least one task before submitting");
        }
    }
}
