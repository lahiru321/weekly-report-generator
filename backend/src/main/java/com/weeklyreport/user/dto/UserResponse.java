package com.weeklyreport.user.dto;

import com.weeklyreport.user.Role;
import com.weeklyreport.user.User;

public record UserResponse(Long id, String fullName, String email, Role role, boolean active) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.isActive());
    }
}
