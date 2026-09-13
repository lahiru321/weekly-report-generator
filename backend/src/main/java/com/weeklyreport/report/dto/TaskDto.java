package com.weeklyreport.report.dto;

import com.weeklyreport.report.TaskPriority;
import com.weeklyreport.report.TaskStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record TaskDto(
        @NotBlank(message = "Task name is required") @Size(max = 200) String name,
        @NotNull TaskPriority priority,
        @NotNull @Min(0) @Max(100) Integer plannedPct,
        @NotNull @Min(0) @Max(100) Integer actualPct,
        @NotNull TaskStatus status,
        @NotNull @DecimalMin("0.0") @DecimalMax("168.0") BigDecimal plannedHours,
        @NotNull @DecimalMin("0.0") @DecimalMax("168.0") BigDecimal spentHours,
        @Size(max = 500) String output
) {
}
