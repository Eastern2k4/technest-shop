package com.example.ecommerce.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.auth.AuthDtos.AuthResponse;
import com.example.ecommerce.auth.AuthDtos.LoginRequest;
import com.example.ecommerce.auth.AuthDtos.RegisterRequest;
import com.example.ecommerce.security.JwtService;
import com.example.ecommerce.user.Role;
import com.example.ecommerce.user.RoleRepository;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;

@Service
public class AuthService {
    private final AuthenticationManager authManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final AuthRateLimitService authRateLimitService;

    public AuthService(
            AuthenticationManager authManager,
            PasswordEncoder passwordEncoder,
            UserRepository userRepository,
            RoleRepository roleRepository,
            JwtService jwtService,
            AuthRateLimitService authRateLimitService) {
        this.authManager = authManager;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jwtService = jwtService;
        this.authRateLimitService = authRateLimitService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
        }

        Role role = roleRepository.findByName("customer")
                .orElseThrow(() -> new IllegalStateException("Missing role: customer"));

        User user = new User();
        user.setEmail(email);
        user.setUserNameColumn(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setRole(role);

        userRepository.save(user);
        return new AuthResponse(jwtService.generate(user));
    }

    public AuthResponse login(LoginRequest request, String clientIp) {
        String email = normalizeEmail(request.email());
        String rateLimitKey = buildRateLimitKey(clientIp, email);

        authRateLimitService.assertLoginAllowed(rateLimitKey);
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (AuthenticationException ex) {
            authRateLimitService.recordLoginFailure(rateLimitKey);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        authRateLimitService.recordLoginSuccess(rateLimitKey);
        return new AuthResponse(jwtService.generate(user));
    }

    private String buildRateLimitKey(String clientIp, String email) {
        String normalizedIp = normalize(clientIp);
        return (normalizedIp != null ? normalizedIp : "unknown") + "|" + email;
    }

    private String normalizeEmail(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toLowerCase();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
