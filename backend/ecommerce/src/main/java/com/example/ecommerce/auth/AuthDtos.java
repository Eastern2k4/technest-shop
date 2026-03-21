package com.example.ecommerce.auth;

public class AuthDtos {
    public record LoginRequest(String email, String password) {
    }

    public record RegisterRequest(String email, String password, String fullName) {
    }

    public record AuthResponse(String token) {
    }

    public record AuthStatusResponse(boolean authenticated) {
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
