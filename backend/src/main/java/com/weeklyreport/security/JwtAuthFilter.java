package com.weeklyreport.security;

import com.weeklyreport.user.User;
import com.weeklyreport.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Reads the JWT cookie on every request and, if valid, marks the request as authenticated.
 * The user is re-loaded from the database so role changes and deactivation take effect immediately.
 * Created in SecurityConfig (not a @Component) so it only runs inside the security filter chain.
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuthCookieService authCookieService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, AuthCookieService authCookieService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.authCookieService = authCookieService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        readToken(request)
                .flatMap(jwtService::parseUserId)
                .flatMap(userRepository::findById)
                .filter(User::isActive)
                .ifPresent(this::authenticate);

        chain.doFilter(request, response);
    }

    private void authenticate(User user) {
        AuthUser principal = new AuthUser(user.getId(), user.getEmail(), user.getRole());
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        var authentication = UsernamePasswordAuthenticationToken.authenticated(principal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private Optional<String> readToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookie.getName().equals(authCookieService.getCookieName()))
                .map(Cookie::getValue)
                .filter(value -> !value.isBlank())
                .findFirst();
    }
}
