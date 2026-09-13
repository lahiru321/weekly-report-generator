package com.weeklyreport.admin;

import com.weeklyreport.admin.dto.CreateUserRequest;
import com.weeklyreport.common.ApiException;
import com.weeklyreport.security.AuthUser;
import com.weeklyreport.user.Role;
import com.weeklyreport.user.User;
import com.weeklyreport.user.UserRepository;
import com.weeklyreport.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return userRepository.findAllByOrderByFullName().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setRole(request.role());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse changeRole(AuthUser admin, Long userId, Role role) {
        // Prevents an admin from accidentally locking themselves out
        if (admin.id().equals(userId)) {
            throw ApiException.badRequest("You cannot change your own role");
        }
        User user = findUser(userId);
        user.setRole(role);
        return UserResponse.from(user);
    }

    /** "Removing" a member deactivates them, so their report history is kept. */
    @Transactional
    public UserResponse setActive(AuthUser admin, Long userId, boolean active) {
        if (admin.id().equals(userId) && !active) {
            throw ApiException.badRequest("You cannot deactivate your own account");
        }
        User user = findUser(userId);
        user.setActive(active);
        return UserResponse.from(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
