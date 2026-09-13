package com.weeklyreport.team;

import com.weeklyreport.team.dto.MemberProfileResponse;
import com.weeklyreport.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Team member lookup for managers (filters, member profile page). */
@RestController
@RequestMapping("/api/manager/members")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    public List<UserResponse> list() {
        return teamService.listMembers();
    }

    @GetMapping("/{id}")
    public MemberProfileResponse profile(@PathVariable Long id) {
        return teamService.profile(id);
    }
}
