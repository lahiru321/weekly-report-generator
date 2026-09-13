package com.weeklyreport.team;

import com.weeklyreport.common.ApiException;
import com.weeklyreport.common.WeekUtils;
import com.weeklyreport.project.Project;
import com.weeklyreport.project.ProjectRepository;
import com.weeklyreport.report.Report;
import com.weeklyreport.report.ReportRepository;
import com.weeklyreport.report.ReportStatus;
import com.weeklyreport.report.ReportVersionRepository;
import com.weeklyreport.team.dto.MemberProfileResponse;
import com.weeklyreport.user.Role;
import com.weeklyreport.user.User;
import com.weeklyreport.user.UserRepository;
import com.weeklyreport.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ReportVersionRepository versionRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<UserResponse> listMembers() {
        return userRepository.findByRoleAndActiveTrueOrderByFullName(Role.MEMBER).stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MemberProfileResponse profile(Long userId) {
        User user = userRepository.findById(userId)
                .filter(candidate -> candidate.getRole() == Role.MEMBER)
                .orElseThrow(() -> ApiException.notFound("Team member not found"));

        List<Report> reports = reportRepository.findByUserIdOrderByWeekStartDesc(userId);
        List<Report> submitted = reports.stream().filter(report -> report.getCurrentVersion() > 0).toList();
        Map<Long, Instant> firstSubmitted = versionRepository.firstSubmissionTimes(submitted);

        int lateSubmissions = (int) submitted.stream()
                .filter(report -> {
                    Instant first = firstSubmitted.get(report.getId());
                    return first != null && first.isAfter(WeekUtils.deadlineFor(report.getWeekStart()));
                })
                .count();
        double averageCompleted = submitted.stream().mapToInt(Report::countCompletedTasks).average().orElse(0);
        BigDecimal totalHours = submitted.stream()
                .flatMap(report -> report.getHoursByType().values().stream())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new MemberProfileResponse(
                UserResponse.from(user),
                projectRepository.findByMembersIdOrderByName(userId).stream().map(Project::getName).toList(),
                reports.size(),
                count(reports, ReportStatus.APPROVED),
                count(reports, ReportStatus.SUBMITTED),
                count(reports, ReportStatus.NEEDS_CORRECTION),
                count(reports, ReportStatus.DRAFT),
                submitted.size() - lateSubmissions,
                lateSubmissions,
                Math.round(averageCompleted * 10) / 10.0,
                totalHours,
                submitted.isEmpty() ? 0 : submitted.get(0).getBlockers().size());
    }

    private static int count(List<Report> reports, ReportStatus status) {
        return (int) reports.stream().filter(report -> report.getStatus() == status).count();
    }
}
