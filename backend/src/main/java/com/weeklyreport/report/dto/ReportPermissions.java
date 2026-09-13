package com.weeklyreport.report.dto;

/** What the current user may do with a report, so the UI doesn't have to repeat the rules. */
public record ReportPermissions(boolean canEdit, boolean canSubmit, boolean canReview) {
}
