package com.weeklyreport.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Builds the httpOnly cookie that carries the JWT, so JavaScript in the browser can never read the token.
 */
@Component
public class AuthCookieService {

    private final String cookieName;
    private final boolean secure;
    private final Duration maxAge;

    public AuthCookieService(@Value("${app.jwt.cookie-name}") String cookieName,
                             @Value("${app.jwt.cookie-secure}") boolean secure,
                             JwtService jwtService) {
        this.cookieName = cookieName;
        this.secure = secure;
        this.maxAge = jwtService.getExpiration();
    }

    public String getCookieName() {
        return cookieName;
    }

    public ResponseCookie create(String token) {
        return build(token, maxAge);
    }

    public ResponseCookie clear() {
        return build("", Duration.ZERO);
    }

    private ResponseCookie build(String value, Duration age) {
        return ResponseCookie.from(cookieName, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(age)
                .build();
    }
}
