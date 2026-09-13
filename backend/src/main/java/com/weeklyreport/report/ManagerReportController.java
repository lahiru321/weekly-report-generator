package com.weeklyreport.report;

import com.weeklyreport.common.PageResponse;
import com.weeklyreport.common.WeekUtils;
import com.weeklyreport.report.dto.ReportDetailResponse;
import com.weeklyreport.report.dto.ReportSummaryResponse;
import com.weeklyreport.report.dto.ReviewRequest;
import com.weeklyreport.security.AuthUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Manager/admin endpoints. /api/manager/** is restricted to MANAGER and ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/manager/reports")
@RequiredArgsConstructor
public class ManagerReportController {

    private final ReportService reportService;
    private final ReportWorkflowService workflowService;

    @GetMapping
    public PageResponse<ReportSummaryResponse> search(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // "week" is a shortcut for a from/to range covering exactly that week
        if (week != null) {
            from = WeekUtils.startOfWeek(week);
            to = from;
        }
        return reportService.search(new ReportFilter(userId, projectId, status, from, to), page, size);
    }

    @PostMapping("/{id}/approve")
    public ReportDetailResponse approve(@AuthenticationPrincipal AuthUser reviewer,
                                        @PathVariable Long id,
                                        @Valid @RequestBody(required = false) ReviewRequest request) {
        workflowService.approve(reviewer, id, request == null ? null : request.comment());
        return reportService.getDetail(reviewer, id);
    }

    @PostMapping("/{id}/request-changes")
    public ReportDetailResponse requestChanges(@AuthenticationPrincipal AuthUser reviewer,
                                               @PathVariable Long id,
                                               @Valid @RequestBody ReviewRequest request) {
        workflowService.requestChanges(reviewer, id, request.comment());
        return reportService.getDetail(reviewer, id);
    }
}
