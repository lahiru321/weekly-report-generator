package com.weeklyreport.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** One message in the assistant chat. The frontend sends the whole conversation on every request. */
public record ChatMessage(
        @NotNull @Pattern(regexp = "user|assistant", message = "Role must be 'user' or 'assistant'") String role,
        @NotBlank(message = "Message is required") @Size(max = 2000) String content
) {
}
