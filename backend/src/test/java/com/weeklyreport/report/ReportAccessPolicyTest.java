package com.weeklyreport.report;

import com.weeklyreport.common.ApiException;
import com.weeklyreport.security.AuthUser;
import com.weeklyreport.user.Role;
import com.weeklyreport.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Ownership rules: who can view and change a report. */
class ReportAccessPolicyTest {

    private final ReportAccessPolicy policy = new ReportAccessPolicy();

    private final AuthUser owner = new AuthUser(1L, "owner@test.com", Role.MEMBER);
    private final AuthUser otherMember = new AuthUser(2L, "other@test.com", Role.MEMBER);
    private final AuthUser manager = new AuthUser(3L, "manager@test.com", Role.MANAGER);

    @Test
    void ownerCanViewAndChangeOwnReport() {
        Report report = reportOwnedBy(1L, ReportStatus.DRAFT);

        assertThatCode(() -> policy.assertCanView(owner, report)).doesNotThrowAnyException();
        assertThatCode(() -> policy.assertOwner(owner, report)).doesNotThrowAnyException();
    }

    @Test
    void memberCannotViewAnotherMembersReport() {
        Report report = reportOwnedBy(1L, ReportStatus.APPROVED);

        assertForbidden(() -> policy.assertCanView(otherMember, report));
        assertForbidden(() -> policy.assertOwner(otherMember, report));
    }

    @Test
    void managerCanViewSubmittedReportsButNotChangeThem() {
        Report report = reportOwnedBy(1L, ReportStatus.SUBMITTED);

        assertThatCode(() -> policy.assertCanView(manager, report)).doesNotThrowAnyException();
        assertForbidden(() -> policy.assertOwner(manager, report));
    }

    @Test
    void draftsArePrivateEvenFromManagers() {
        assertForbidden(() -> policy.assertCanView(manager, reportOwnedBy(1L, ReportStatus.DRAFT)));
    }

    @Test
    void onlyDraftOrNeedsCorrectionReportsAreEditable() {
        assertThat(ReportWorkflowService.isEditable(ReportStatus.DRAFT)).isTrue();
        assertThat(ReportWorkflowService.isEditable(ReportStatus.NEEDS_CORRECTION)).isTrue();
        assertThat(ReportWorkflowService.isEditable(ReportStatus.SUBMITTED)).isFalse();
        assertThat(ReportWorkflowService.isEditable(ReportStatus.APPROVED)).isFalse();
        assertThat(ReportWorkflowService.isReviewable(ReportStatus.SUBMITTED)).isTrue();
        assertThat(ReportWorkflowService.isReviewable(ReportStatus.NEEDS_CORRECTION)).isFalse();
    }

    private void assertForbidden(org.assertj.core.api.ThrowableAssert.ThrowingCallable action) {
        assertThatThrownBy(action)
                .isInstanceOf(ApiException.class)
                .extracting(error -> ((ApiException) error).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    private Report reportOwnedBy(Long userId, ReportStatus status) {
        User user = new User();
        user.setId(userId);
        Report report = new Report();
        report.setUser(user);
        report.setStatus(status);
        return report;
    }
}
