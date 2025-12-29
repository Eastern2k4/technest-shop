package com.example.ecommerce.auth;

public class AuthDtos {
    public record LoginRequest(String email, String password) {
    }

    public record RegisterRequest(String email, String password, String fullName) {
    }

    public record AuthResponse(String token) {
    }

}
