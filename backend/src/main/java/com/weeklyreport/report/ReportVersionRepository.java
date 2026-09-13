package com.weeklyreport.report;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public interface ReportVersionRepository extends JpaRepository<ReportVersion, Long> {

    List<ReportVersion> findByReportIdOrderByVersionNoDesc(Long reportId);

    Optional<ReportVersion> findByReportIdAndVersionNo(Long reportId, int versionNo);

    @EntityGraph(attributePaths = {"report", "report.user"})
    List<ReportVersion> findAllByOrderBySubmittedAtDesc(Pageable pageable);

    @Query("""
            select new com.weeklyreport.report.FirstSubmission(v.report.id, min(v.submittedAt))
            from ReportVersion v
            where v.report.id in :reportIds
            group by v.report.id
            """)
    List<FirstSubmission> findFirstSubmissions(@Param("reportIds") Collection<Long> reportIds);

    /** Report id -> time of its first submission, for reports that were submitted at least once. */
    default Map<Long, Instant> firstSubmissionTimes(Collection<Report> reports) {
        List<Long> reportIds = reports.stream()
                .filter(report -> report.getCurrentVersion() > 0)
                .map(Report::getId)
                .toList();
        if (reportIds.isEmpty()) {
            return Map.of();
        }
        return findFirstSubmissions(reportIds).stream()
                .collect(Collectors.toMap(FirstSubmission::reportId, FirstSubmission::submittedAt));
    }
}
