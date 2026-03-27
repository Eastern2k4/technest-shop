package com.example.ecommerce.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.auth.AuthDtos.UpdateProfileRequest;
import com.example.ecommerce.auth.AuthDtos.UserProfileResponse;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;

@Service
public class AuthProfileService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfileResponse getProfile(User principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        User user = userRepository.findByEmailIgnoreCase(principal.getEmail()).orElse(principal);
        return toUserProfileResponse(user, null);
    }

    @Transactional
    public UserProfileResponse updateProfile(User currentUser, UpdateProfileRequest request) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile payload is required");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String username = normalize(request.username());
        if (username != null
                && !username.equals(user.getUserNameColumn())
                && userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already in use");
        }

        if (request.fullName() != null) {
            user.setFullName(normalize(request.fullName()));
        }
        if (request.username() != null) {
            user.setUserNameColumn(username != null ? username : user.getEmail());
        }
        if (request.phone() != null) {
            user.setPhone(normalize(request.phone()));
        }
        if (request.addressText() != null) {
            user.setAddressText(normalize(request.addressText()));
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(normalizeAvatarUrl(request.avatarUrl()));
        }
        if (normalize(request.newPassword()) != null) {
            if (request.newPassword().trim().length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "New password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(request.newPassword().trim()));
        }

        userRepository.save(user);
        return toUserProfileResponse(user, "Profile updated successfully");
    }

    private UserProfileResponse toUserProfileResponse(User user, String message) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getUserNameColumn() != null ? user.getUserNameColumn() : user.getEmail(),
                user.getFullName() != null ? user.getFullName() : "",
                user.getPhone() != null ? user.getPhone() : "",
                user.getAddressText() != null ? user.getAddressText() : "",
                user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                user.getRole() != null ? user.getRole().getName() : "",
                message);
    }

    private String normalizeAvatarUrl(String avatarUrl) {
        String normalized = normalize(avatarUrl);
        if (normalized == null) {
            return null;
        }
        if (normalized.startsWith("data:image") && normalized.length() > 100000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Avatar image is too large. Please use a regular image URL (http://...) instead of base64 data. Maximum base64 size: 100KB");
        }
        if (!normalized.startsWith("data:image") && normalized.length() > 50000) {
            return normalized.substring(0, 50000);
        }
        return normalized;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
