package com.example.ecommerce.auth;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ecommerce.auth.AuthDtos.AuthResponse;
import com.example.ecommerce.auth.AuthDtos.AuthStatusResponse;
import com.example.ecommerce.auth.AuthDtos.LoginRequest;
import com.example.ecommerce.auth.AuthDtos.RegisterRequest;
import com.example.ecommerce.auth.AuthDtos.UpdateProfileRequest;
import com.example.ecommerce.auth.AuthDtos.UserProfileResponse;
import com.example.ecommerce.service.AuthService;
import com.example.ecommerce.service.AuthProfileService;
import com.example.ecommerce.user.User;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthProfileService authProfileService;

    public AuthController(AuthService authService, AuthProfileService authProfileService) {
        this.authService = authService;
        this.authProfileService = authProfileService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody @Valid RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest req, HttpServletRequest request) {
        return authService.login(req, extractClientIp(request));
    }

    @GetMapping("/me")
    public Object me(@org.springframework.security.core.annotation.AuthenticationPrincipal User u) {
        if (u == null)
            return new AuthStatusResponse(false);
        return authProfileService.getProfile(u);
    }

    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @org.springframework.web.bind.annotation.PutMapping("/me")
    public UserProfileResponse updateProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal User currentUser,
            @RequestBody @Valid UpdateProfileRequest updates) {
        return authProfileService.updateProfile(currentUser, updates);
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request != null ? request.getHeader("X-Forwarded-For") : null;
        String clientIp = request != null ? request.getRemoteAddr() : "unknown";
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            clientIp = forwardedFor.split(",")[0].trim();
        }
        return clientIp;
    }
}
