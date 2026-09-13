package com.weeklyreport.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportItemDto(
        @NotBlank(message = "Description is required") @Size(max = 500) String description,
        boolean isKey
) {
}
