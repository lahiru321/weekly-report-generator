package com.weeklyreport.common;

public final class TextUtils {

    private TextUtils() {
    }

    /** Trims the value and turns blank strings into null. */
    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
