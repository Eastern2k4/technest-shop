package com.example.ecommerce.auth;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.auth.AuthDtos.AuthResponse;
import com.example.ecommerce.auth.AuthDtos.AuthStatusResponse;
import com.example.ecommerce.auth.AuthDtos.LoginRequest;
import com.example.ecommerce.auth.AuthDtos.RegisterRequest;
import com.example.ecommerce.auth.AuthDtos.UpdateProfileRequest;
import com.example.ecommerce.auth.AuthDtos.UserProfileResponse;
import com.example.ecommerce.security.JwtService;
import com.example.ecommerce.service.AuthProfileService;
import com.example.ecommerce.service.AuthRateLimitService;
import com.example.ecommerce.user.Role;
import com.example.ecommerce.user.RoleRepository;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final PasswordEncoder encoder;
    private final UserRepository users;
    private final RoleRepository roles;
    private final JwtService jwt;
    private final AuthProfileService authProfileService;
    private final AuthRateLimitService authRateLimitService;

    public AuthController(AuthenticationManager am, PasswordEncoder enc, UserRepository ur,
            RoleRepository rr, JwtService jwt, AuthProfileService authProfileService,
            AuthRateLimitService authRateLimitService) {
        this.authManager = am;
        this.encoder = enc;
        this.users = ur;
        this.roles = rr;
        this.jwt = jwt;
        this.authProfileService = authProfileService;
        this.authRateLimitService = authRateLimitService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody @Valid RegisterRequest req) {
        String email = normalizeEmail(req.email());

        if (users.existsByEmailIgnoreCase(email))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");

        Role role = roles.findByName("customer").orElseThrow();
        User u = new User();
        u.setEmail(email);
        u.setUserNameColumn(email);
        String hash = encoder.encode(req.password());
        u.setPassword(hash);
        u.setFullName(req.fullName().trim());
        u.setRole(role);
        users.save(u);
        return new AuthResponse(jwt.generate(u));
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest req, HttpServletRequest request) {
        String email = normalizeEmail(req.email());
        String rateLimitKey = buildRateLimitKey(request, email);
        authRateLimitService.assertLoginAllowed(rateLimitKey);
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, req.password()));
        } catch (AuthenticationException ex) {
            authRateLimitService.recordLoginFailure(rateLimitKey);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        var u = users.findByEmailIgnoreCase(email).orElseThrow();
        authRateLimitService.recordLoginSuccess(rateLimitKey);
        return new AuthResponse(jwt.generate(u));
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

    private String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }

    private String buildRateLimitKey(HttpServletRequest request, String email) {
        String forwardedFor = request != null ? request.getHeader("X-Forwarded-For") : null;
        String clientIp = request != null ? request.getRemoteAddr() : "unknown";
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            clientIp = forwardedFor.split(",")[0].trim();
        }
        return clientIp + "|" + email;
    }
}
