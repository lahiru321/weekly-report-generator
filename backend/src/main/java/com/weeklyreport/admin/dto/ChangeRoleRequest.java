package com.weeklyreport.admin.dto;

import com.weeklyreport.user.Role;
import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(@NotNull Role role) {
}
