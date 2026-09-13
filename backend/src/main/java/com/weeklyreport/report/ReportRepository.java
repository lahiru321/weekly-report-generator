package com.weeklyreport.report;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    boolean existsByUserIdAndWeekStart(Long userId, LocalDate weekStart);

    Optional<Report> findByUserIdAndWeekStart(Long userId, LocalDate weekStart);

    @EntityGraph(attributePaths = {"user", "project"})
    List<Report> findByWeekStartBetween(LocalDate from, LocalDate to);

    @EntityGraph(attributePaths = {"project"})
    List<Report> findByUserIdOrderByWeekStartDesc(Long userId);

    long countByStatus(ReportStatus status);
}
