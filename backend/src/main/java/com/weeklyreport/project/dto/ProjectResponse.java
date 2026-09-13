package com.weeklyreport.project.dto;

import com.weeklyreport.project.Project;
import com.weeklyreport.user.User;

import java.util.Comparator;
import java.util.List;

public record ProjectResponse(Long id, String name, String description, List<Member> members) {

    public record Member(Long id, String fullName) {
    }

    public static ProjectResponse from(Project project) {
        List<Member> members = project.getMembers().stream()
                .sorted(Comparator.comparing(User::getFullName))
                .map(user -> new Member(user.getId(), user.getFullName()))
                .toList();
        return new ProjectResponse(project.getId(), project.getName(), project.getDescription(), members);
    }
}
