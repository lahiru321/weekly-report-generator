package com.weeklyreport.admin;

import com.weeklyreport.admin.dto.ChangeActiveRequest;
import com.weeklyreport.admin.dto.ChangeRoleRequest;
import com.weeklyreport.admin.dto.CreateUserRequest;
import com.weeklyreport.security.AuthUser;
import com.weeklyreport.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** User management. /api/admin/** is restricted to ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<UserResponse> list() {
        return adminUserService.list();
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.create(request));
    }

    @PatchMapping("/{id}/role")
    public UserResponse changeRole(@AuthenticationPrincipal AuthUser admin,
                                   @PathVariable Long id,
                                   @Valid @RequestBody ChangeRoleRequest request) {
        return adminUserService.changeRole(admin, id, request.role());
    }

    @PatchMapping("/{id}/active")
    public UserResponse setActive(@AuthenticationPrincipal AuthUser admin,
                                  @PathVariable Long id,
                                  @Valid @RequestBody ChangeActiveRequest request) {
        return adminUserService.setActive(admin, id, request.active());
    }
}
