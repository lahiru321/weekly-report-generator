package com.weeklyreport.report;

import com.weeklyreport.common.ApiException;
import com.weeklyreport.security.AuthUser;
import org.springframework.stereotype.Component;

/**
 * All "who can see / change this report" rules live here.
 * - Team members: only their own reports.
 * - Managers/admins: any report that has been submitted at least once (drafts stay private).
 */
@Component
public class ReportAccessPolicy {

    public boolean isOwner(AuthUser user, Report report) {
        return report.getUser().getId().equals(user.id());
    }

    public void assertCanView(AuthUser user, Report report) {
        if (isOwner(user, report)) {
            return;
        }
        if (!user.isManagerOrAdmin()) {
            throw ApiException.forbidden("You can only view your own reports");
        }
        if (report.getStatus() == ReportStatus.DRAFT) {
            throw ApiException.forbidden("This report is still a private draft");
        }
    }

    public void assertOwner(AuthUser user, Report report) {
        if (!isOwner(user, report)) {
            throw ApiException.forbidden("You can only change your own reports");
        }
    }
}
