package com.weeklyreport.security;

import com.weeklyreport.admin.AdminUserController;
import com.weeklyreport.admin.AdminUserService;
import com.weeklyreport.ai.AiController;
import com.weeklyreport.ai.AiService;
import com.weeklyreport.ai.dto.AiReply;
import com.weeklyreport.config.SecurityConfig;
import com.weeklyreport.dashboard.DashboardController;
import com.weeklyreport.dashboard.DashboardService;
import com.weeklyreport.report.ManagerReportController;
import com.weeklyreport.report.ReportController;
import com.weeklyreport.report.ReportService;
import com.weeklyreport.report.ReportWorkflowService;
import com.weeklyreport.user.Role;
import com.weeklyreport.user.User;
import com.weeklyreport.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs the real SecurityConfig, JWT cookie filter and @PreAuthorize rules against the controllers.
 * Services are mocked, so no database is needed.
 */
@WebMvcTest(controllers = {
        ReportController.class,
        ManagerReportController.class,
        DashboardController.class,
        AdminUserController.class,
        AiController.class
})
@Import({SecurityConfig.class, JwtService.class, AuthCookieService.class})
class RoleBasedAccessTest {

    private static final String REPORT_BODY = """
            {"weekStart": "2026-09-07", "tasks": [], "nextWeekTasks": [], "blockers": [], "achievements": []}
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;
    @MockitoBean
    private ReportService reportService;
    @MockitoBean
    private ReportWorkflowService workflowService;
    @MockitoBean
    private DashboardService dashboardService;
    @MockitoBean
    private AdminUserService adminUserService;
    @MockitoBean
    private AiService aiService;

    private User member;
    private User manager;
    private User admin;

    @BeforeEach
    void setUp() {
        member = user(1L, Role.MEMBER);
        manager = user(2L, Role.MANAGER);
        admin = user(3L, Role.ADMIN);
    }

    @Test
    void requestsWithoutLoginAreRejected() throws Exception {
        mockMvc.perform(get("/api/reports/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/dashboard/summary")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidTokenIsTreatedAsNotLoggedIn() throws Exception {
        mockMvc.perform(get("/api/reports/me").cookie(new Cookie("access_token", "not-a-jwt")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deactivatedUserCannotUseTheirToken() throws Exception {
        Cookie cookie = loginCookie(member);
        member.setActive(false);

        mockMvc.perform(get("/api/reports/me").cookie(cookie)).andExpect(status().isUnauthorized());
    }

    @Test
    void memberCanUseOwnReportEndpoints() throws Exception {
        mockMvc.perform(get("/api/reports/me").cookie(loginCookie(member))).andExpect(status().isOk());
    }

    @Test
    void memberCannotReachManagerEndpoints() throws Exception {
        Cookie cookie = loginCookie(member);

        mockMvc.perform(get("/api/manager/reports").cookie(cookie)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/manager/reports/10/approve").cookie(cookie)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/dashboard/summary").cookie(cookie)).andExpect(status().isForbidden());

        verify(workflowService, never()).approve(any(), anyLong(), any());
    }

    @Test
    void memberAndManagerCannotReachAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/users").cookie(loginCookie(member))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/users").cookie(loginCookie(manager))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/users").cookie(loginCookie(admin))).andExpect(status().isOk());
    }

    @Test
    void managerCanUseDashboardAndReviewEndpoints() throws Exception {
        Cookie cookie = loginCookie(manager);

        mockMvc.perform(get("/api/dashboard/summary").cookie(cookie)).andExpect(status().isOk());
        mockMvc.perform(get("/api/manager/reports").cookie(cookie)).andExpect(status().isOk());
    }

    @Test
    void managerCannotRewriteReportContent() throws Exception {
        Cookie cookie = loginCookie(manager);

        mockMvc.perform(put("/api/reports/10").cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(REPORT_BODY))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/reports/10/submit").cookie(cookie)).andExpect(status().isForbidden());

        verify(reportService, never()).update(any(), anyLong(), any());
        verify(workflowService, never()).submit(any(), anyLong());
    }

    @Test
    void onlyManagersCanUseTheAiAssistant() throws Exception {
        String chatBody = """
                {"messages": [{"role": "user", "content": "Who has blockers this week?"}]}
                """;
        when(aiService.chat(any())).thenReturn(new AiReply("No blockers", Instant.now()));

        Cookie memberCookie = loginCookie(member);
        mockMvc.perform(get("/api/manager/ai/status").cookie(memberCookie)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/manager/ai/summary").cookie(memberCookie)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/manager/ai/chat").cookie(memberCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody))
                .andExpect(status().isForbidden());
        verify(aiService, never()).chat(any());

        Cookie managerCookie = loginCookie(manager);
        mockMvc.perform(post("/api/manager/ai/chat").cookie(managerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatBody))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/manager/ai/chat").cookie(managerCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"messages\": []}"))
                .andExpect(status().isBadRequest());
    }

    private Cookie loginCookie(User user) {
        return new Cookie("access_token", jwtService.createToken(user));
    }

    private User user(Long id, Role role) {
        User user = new User();
        user.setId(id);
        user.setFullName(role.name().toLowerCase() + " user");
        user.setEmail(role.name().toLowerCase() + "@test.com");
        user.setRole(role);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        return user;
    }
}
