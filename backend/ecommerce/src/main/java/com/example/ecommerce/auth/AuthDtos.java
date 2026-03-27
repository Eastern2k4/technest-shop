package com.example.ecommerce.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be a valid email address")
            @Size(max = 255, message = "Email must be at most 255 characters")
            String email,
            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
            String password) {
    }

    public record RegisterRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be a valid email address")
            @Size(max = 255, message = "Email must be at most 255 characters")
            String email,
            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
            String password,
            @NotBlank(message = "Full name is required")
            @Size(max = 120, message = "Full name must be at most 120 characters")
            String fullName) {
    }

    public record AuthResponse(String token) {
    }

    public record AuthStatusResponse(boolean authenticated) {
    }

    public record UpdateProfileRequest(
            @Size(max = 120, message = "Full name must be at most 120 characters")
            String fullName,
            @Size(max = 50, message = "Username must be at most 50 characters")
            @Pattern(
                    regexp = "^\\s*$|^[A-Za-z0-9._-]{3,50}$",
                    message = "Username must be 3-50 characters using letters, numbers, dots, underscores, or hyphens")
            String username,
            @Pattern(
                    regexp = "^\\s*$|^[0-9+()\\- ]{8,20}$",
                    message = "Phone must be 8-20 characters and contain only digits or phone symbols")
            String phone,
            @Size(max = 255, message = "Address must be at most 255 characters")
            String addressText,
            @Size(max = 100000, message = "Avatar URL is too long")
            String avatarUrl,
            @Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters")
            String newPassword) {
    }

    public record UserProfileResponse(
            Long id,
            String email,
            String username,
            String fullName,
            String phone,
            String addressText,
            String avatarUrl,
            String role,
            String message) {
    }

}
