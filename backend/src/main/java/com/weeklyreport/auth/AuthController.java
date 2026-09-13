package com.weeklyreport.auth;

import com.weeklyreport.auth.dto.LoginRequest;
import com.weeklyreport.auth.dto.RegisterRequest;
import com.weeklyreport.security.AuthCookieService;
import com.weeklyreport.security.AuthUser;
import com.weeklyreport.security.JwtService;
import com.weeklyreport.user.User;
import com.weeklyreport.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final AuthCookieService authCookieService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return withSessionCookie(HttpStatus.CREATED, user);
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = authService.login(request);
        return withSessionCookie(HttpStatus.OK, user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, authCookieService.clear().toString())
                .build();
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthUser authUser) {
        return UserResponse.from(authService.getUser(authUser.id()));
    }

    private ResponseEntity<UserResponse> withSessionCookie(HttpStatus status, User user) {
        String token = jwtService.createToken(user);
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, authCookieService.create(token).toString())
                .body(UserResponse.from(user));
    }
}
