package com.weeklyreport.admin.dto;

import com.weeklyreport.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Admin adds a team member with a temporary password. */
public record CreateUserRequest(
        @NotBlank @Size(max = 100) String fullName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotNull Role role,
        @NotBlank @Size(min = 8, max = 72, message = "Password must be 8-72 characters") String password
) {
}
