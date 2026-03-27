package com.example.ecommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class UserDtos {
    private UserDtos() {
    }

    public record UserResponse(
            Long id,
            String email,
            String username,
            String fullName,
            String phone,
            String addressText,
            String avatarUrl,
            String role) {
    }

    public record CreateUserRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be a valid email address")
            @Size(max = 255, message = "Email must be at most 255 characters")
            String email,
            @Size(max = 50, message = "Username must be at most 50 characters")
            @Pattern(
                    regexp = "^\\s*$|^[A-Za-z0-9._-]{3,50}$",
                    message = "Username must be 3-50 characters using letters, numbers, dots, underscores, or hyphens")
            String username,
            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
            String password,
            @Size(max = 120, message = "Full name must be at most 120 characters")
            String fullName,
            @Pattern(
                    regexp = "^\\s*$|^[0-9+()\\- ]{8,20}$",
                    message = "Phone must be 8-20 characters and contain only digits or phone symbols")
            String phone,
            @Size(max = 255, message = "Address must be at most 255 characters")
            String addressText,
            @NotBlank(message = "Role is required")
            @Pattern(regexp = "(?i)ADMIN|STAFF|CUSTOMER", message = "Role must be ADMIN, STAFF, or CUSTOMER")
            String role) {
    }

    public record UpdateUserRequest(
            @Email(message = "Email must be a valid email address")
            @Size(max = 255, message = "Email must be at most 255 characters")
            String email,
            @Size(max = 50, message = "Username must be at most 50 characters")
            @Pattern(
                    regexp = "^\\s*$|^[A-Za-z0-9._-]{3,50}$",
                    message = "Username must be 3-50 characters using letters, numbers, dots, underscores, or hyphens")
            String username,
            @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
            String password,
            @Size(max = 120, message = "Full name must be at most 120 characters")
            String fullName,
            @Pattern(
                    regexp = "^\\s*$|^[0-9+()\\- ]{8,20}$",
                    message = "Phone must be 8-20 characters and contain only digits or phone symbols")
            String phone,
            @Size(max = 255, message = "Address must be at most 255 characters")
            String addressText,
            @Pattern(regexp = "(?i)ADMIN|STAFF|CUSTOMER", message = "Role must be ADMIN, STAFF, or CUSTOMER")
            String role) {
    }
}
