package com.weeklyreport.report;

import com.weeklyreport.project.Project;
import com.weeklyreport.user.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.MapKeyEnumerated;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A user's weekly report. The fields below are the current (editable) content.
 * Each submit also stores a frozen copy in {@link ReportVersion}.
 */
@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "week_end", nullable = false)
    private LocalDate weekEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status = ReportStatus.DRAFT;

    /** Number of the latest submitted version; 0 means never submitted. */
    @Column(name = "current_version", nullable = false)
    private int currentVersion;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(columnDefinition = "text")
    private String links;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @ElementCollection
    @CollectionTable(name = "report_tasks", joinColumns = @JoinColumn(name = "report_id"))
    @OrderColumn(name = "position")
    private List<ReportTask> tasks = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "report_next_tasks", joinColumns = @JoinColumn(name = "report_id"))
    @OrderColumn(name = "position")
    @Column(name = "description", nullable = false, length = 500)
    private List<String> nextWeekTasks = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "report_blockers", joinColumns = @JoinColumn(name = "report_id"))
    @OrderColumn(name = "position")
    private List<ReportItem> blockers = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "report_achievements", joinColumns = @JoinColumn(name = "report_id"))
    @OrderColumn(name = "position")
    private List<ReportItem> achievements = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "report_hours", joinColumns = @JoinColumn(name = "report_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "task_type", length = 20)
    @Column(name = "hours", nullable = false, precision = 5, scale = 2)
    private Map<TaskType, BigDecimal> hoursByType = new LinkedHashMap<>();

    public int countCompletedTasks() {
        return (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.COMPLETED).count();
    }
}
