package com.weeklyreport.ai.dto;

/** Lets the UI show "not configured" instead of an error when no API key is set. */
public record AiStatus(boolean enabled) {
}
