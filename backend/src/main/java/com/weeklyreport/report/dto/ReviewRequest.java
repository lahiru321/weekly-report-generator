package com.weeklyreport.report.dto;

import jakarta.validation.constraints.Size;

/** Comment is optional when approving and required when requesting changes (checked in the service). */
public record ReviewRequest(@Size(max = 2000) String comment) {
}
