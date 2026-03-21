package com.example.ecommerce.auth;

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
import com.example.ecommerce.auth.AuthDtos.UserProfileResponse;
import com.example.ecommerce.security.JwtService;
import com.example.ecommerce.user.Role;
import com.example.ecommerce.user.RoleRepository;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final PasswordEncoder encoder;
    private final UserRepository users;
    private final RoleRepository roles;
    private final JwtService jwt;

    public AuthController(AuthenticationManager am, PasswordEncoder enc, UserRepository ur,
            RoleRepository rr, JwtService jwt) {
        this.authManager = am;
        this.encoder = enc;
        this.users = ur;
        this.roles = rr;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest req) {
        String email = req.email();

        if (users.existsByEmail(email))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");

        Role role = roles.findByName("customer").orElseThrow();
        User u = new User();
        u.setEmail(email);
        u.setUserNameColumn(email);
        String hash = encoder.encode(req.password());
        u.setPassword(hash);
        u.setFullName(req.fullName());
        u.setRole(role);
        users.save(u);
        return new AuthResponse(jwt.generate(u, 60L * 60 * 24 * 7));
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest req) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        var u = users.findByEmail(req.email()).orElseThrow();
        return new AuthResponse(jwt.generate(u, 60L * 60 * 24 * 7));
    }

    @GetMapping("/me")
    public Object me(@org.springframework.security.core.annotation.AuthenticationPrincipal User u) {
        if (u == null)
            return new AuthStatusResponse(false);

        // Reload user to ensure role is loaded
        var user = users.findByEmail(u.getEmail()).orElse(u);

        return toUserProfileResponse(user, null);
    }

    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @org.springframework.web.bind.annotation.PutMapping("/me")
    public Object updateProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal User currentUser,
            @RequestBody java.util.Map<String, String> updates) {
        try {
            System.out.println("[AuthController] updateProfile called for user: "
                    + (currentUser != null ? currentUser.getEmail() : "null"));

            if (currentUser == null) {
                System.err.println("[AuthController] ERROR: currentUser is null");
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
            }

            // Reload user from database to get latest state with role
            var u = users.findById(currentUser.getId()).orElseThrow(
                    () -> {
                        System.err.println("[AuthController] ERROR: User not found with ID: " + currentUser.getId());
                        return new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
                    });

            System.out.println("[AuthController] User loaded: " + u.getEmail() + ", role: "
                    + (u.getRole() != null ? u.getRole().getName() : "null"));

            // Ensure role is loaded
            if (u.getRole() == null) {
                System.err.println("[AuthController] ERROR: User role is null for user: " + u.getEmail());
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "User role not found");
            }

            // Update allowed fields
            if (updates.containsKey("fullName")) {
                u.setFullName(updates.get("fullName"));
                System.out.println("[AuthController] Updated fullName");
            }
            if (updates.containsKey("username")) {
                String newUsername = updates.get("username");
                // Check if username is already taken by another user
                if (!newUsername.equals(u.getUserNameColumn()) && users.existsByUsername(newUsername)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already in use");
                }
                u.setUserNameColumn(newUsername);
                System.out.println("[AuthController] Updated username");
            }
            if (updates.containsKey("phone")) {
                u.setPhone(updates.get("phone"));
                System.out.println("[AuthController] Updated phone");
            }
            if (updates.containsKey("addressText")) {
                u.setAddressText(updates.get("addressText"));
                System.out.println("[AuthController] Updated addressText");
            }
            if (updates.containsKey("avatarUrl")) {
                String avatarUrl = updates.get("avatarUrl");
                System.out
                        .println("[AuthController] Avatar URL length: " + (avatarUrl != null ? avatarUrl.length() : 0));

                // Reject base64 data URLs that are too long - they should use regular URLs
                // instead
                if (avatarUrl != null && avatarUrl.startsWith("data:image") && avatarUrl.length() > 100000) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Avatar image is too large. Please use a regular image URL (http://...) instead of base64 data. Maximum base64 size: 100KB");
                }

                // For regular URLs, allow up to 50000 chars (TEXT column can handle up to 65KB)
                if (avatarUrl != null && !avatarUrl.startsWith("data:image") && avatarUrl.length() > 50000) {
                    System.err.println("[AuthController] WARNING: Avatar URL is very long (" + avatarUrl.length()
                            + " chars), truncating to 50000...");
                    avatarUrl = avatarUrl.substring(0, 50000);
                }

                u.setAvatarUrl(avatarUrl);
                System.out.println("[AuthController] Updated avatarUrl");
            }

            // Handle password change
            if (updates.containsKey("newPassword")) {
                String newPassword = updates.get("newPassword");

                // Update password
                u.setPassword(encoder.encode(newPassword));
                System.out.println("[AuthController] Updated password");
            }

            System.out.println("[AuthController] Saving user...");
            users.save(u);
            System.out.println("[AuthController] User saved successfully");

            // Return updated user info
            return toUserProfileResponse(u, "Profile updated successfully");
        } catch (ResponseStatusException e) {
            System.err
                    .println("[AuthController] ResponseStatusException: " + e.getStatusCode() + " - " + e.getReason());
            throw e;
        } catch (Exception e) {
            System.err.println("[AuthController] Unexpected error: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to update profile: " + e.getMessage());
        }
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
}
