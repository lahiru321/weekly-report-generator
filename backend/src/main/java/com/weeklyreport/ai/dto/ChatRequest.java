package com.weeklyreport.ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChatRequest(
        @NotEmpty(message = "At least one message is required")
        @Size(max = 20, message = "Conversation is too long, please start a new chat")
        List<@Valid ChatMessage> messages
) {
}
