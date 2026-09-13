package com.weeklyreport.security;

import com.weeklyreport.user.Role;

/**
 * The logged-in user, available in controllers via {@code @AuthenticationPrincipal AuthUser user}.
 */
public record AuthUser(Long id, String email, Role role) {

    public boolean isManagerOrAdmin() {
        return role == Role.MANAGER || role == Role.ADMIN;
    }
}
