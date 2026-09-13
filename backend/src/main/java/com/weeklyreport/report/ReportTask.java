package com.weeklyreport.report;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/** One row of the "tasks completed" table. Stored in report_tasks. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportTask {

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TaskPriority priority;

    @Column(name = "planned_pct", nullable = false)
    private int plannedPct;

    @Column(name = "actual_pct", nullable = false)
    private int actualPct;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status;

    @Column(name = "planned_hours", nullable = false, precision = 5, scale = 2)
    private BigDecimal plannedHours;

    @Column(name = "spent_hours", nullable = false, precision = 5, scale = 2)
    private BigDecimal spentHours;

    @Column(length = 500)
    private String output;
}
