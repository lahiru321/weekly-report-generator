package com.weeklyreport.admin.dto;

import jakarta.validation.constraints.NotNull;

public record ChangeActiveRequest(@NotNull Boolean active) {
}
