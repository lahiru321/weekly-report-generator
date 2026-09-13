package com.weeklyreport.report;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewActionRepository extends JpaRepository<ReviewAction, Long> {

    List<ReviewAction> findByReportIdOrderByCreatedAtDesc(Long reportId);

    @EntityGraph(attributePaths = {"report", "report.user", "reviewer", "version"})
    List<ReviewAction> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
