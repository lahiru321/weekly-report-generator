package com.weeklyreport.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProjectRequest(
        @NotBlank(message = "Name is required") @Size(max = 100) String name,
        @Size(max = 500) String description,
        List<Long> memberIds
) {
    public ProjectRequest {
        memberIds = memberIds == null ? List.of() : memberIds;
    }
}
