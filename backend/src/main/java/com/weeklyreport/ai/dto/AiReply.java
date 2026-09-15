package com.weeklyreport.ai.dto;

import java.time.Instant;

public record AiReply(String text, Instant generatedAt) {
}
