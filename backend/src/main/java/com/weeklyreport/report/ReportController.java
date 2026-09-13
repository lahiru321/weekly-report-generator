package com.weeklyreport.report;

import com.weeklyreport.common.PageResponse;
import com.weeklyreport.report.dto.ReportDetailResponse;
import com.weeklyreport.report.dto.ReportRequest;
import com.weeklyreport.report.dto.ReportSummaryResponse;
import com.weeklyreport.report.dto.ReportVersionResponse;
import com.weeklyreport.security.AuthUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Team member endpoints. Ownership is checked in the services, so users only ever reach their own data. */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ReportWorkflowService workflowService;

    @GetMapping("/me")
    public PageResponse<ReportSummaryResponse> myReports(@AuthenticationPrincipal AuthUser user,
                                                         @RequestParam(required = false) ReportStatus status,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "20") int size) {
        // The user id always comes from the login cookie, never from the request
        return reportService.search(new ReportFilter(user.id(), null, status, null, null), page, size);
    }

    @GetMapping("/me/week")
    public ReportDetailResponse myReportForWeek(@AuthenticationPrincipal AuthUser user,
                                                @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reportService.getMineForWeek(user, date);
    }

    @PostMapping
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<ReportDetailResponse> create(@AuthenticationPrincipal AuthUser user,
                                                       @Valid @RequestBody ReportRequest request) {
        Long reportId = reportService.create(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.getDetail(user, reportId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MEMBER')")
    public ReportDetailResponse update(@AuthenticationPrincipal AuthUser user,
                                       @PathVariable Long id,
                                       @Valid @RequestBody ReportRequest request) {
        reportService.update(user, id, request);
        return reportService.getDetail(user, id);
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('MEMBER')")
    public ReportDetailResponse submit(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        workflowService.submit(user, id);
        return reportService.getDetail(user, id);
    }

    @GetMapping("/{id}")
    public ReportDetailResponse get(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return reportService.getDetail(user, id);
    }

    @GetMapping("/{id}/versions")
    public List<ReportVersionResponse> versions(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return reportService.getVersions(user, id);
    }
}
