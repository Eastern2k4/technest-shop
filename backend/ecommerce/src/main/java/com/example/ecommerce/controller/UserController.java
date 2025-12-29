package com.example.ecommerce.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.user.Role;
import com.example.ecommerce.user.RoleRepository;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrderRepository orderRepository;

    public UserController(UserRepository userRepository, RoleRepository roleRepository,
            PasswordEncoder passwordEncoder, OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::userToMap)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Map<String, Object> getUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return userToMap(user);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody CreateUserRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
        }

        // Check if username already exists (if provided)
        if (request.username() != null && !request.username().isBlank()) {
            if (userRepository.existsByUsername(request.username())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already in use");
            }
        }

        // Get role
        Role role = roleRepository.findByName(request.role().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid role: " + request.role()));

        // Create user
        User user = new User();
        user.setEmail(request.email());
        user.setUserNameColumn(request.username() != null && !request.username().isBlank()
                ? request.username()
                : request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user.setAddressText(request.addressText());
        user.setRole(role);

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(userToMap(saved));
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Update email if provided and different
        if (request.email() != null && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
            }
            user.setEmail(request.email());
        }

        // Update username if provided
        if (request.username() != null && !request.username().isBlank()) {
            if (!request.username().equals(user.getUserNameColumn())
                    && userRepository.existsByUsername(request.username())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already in use");
            }
            user.setUserNameColumn(request.username());
        }

        // Update password if provided
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        // Update other fields
        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.addressText() != null) {
            user.setAddressText(request.addressText());
        }

        // Update role if provided
        if (request.role() != null && !request.role().isBlank()) {
            Role role = roleRepository.findByName(request.role().toLowerCase())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Invalid role: " + request.role()));
            user.setRole(role);
        }

        User updated = userRepository.save(user);
        return userToMap(updated);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        orderRepository.deleteByUserId(id);
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> userToMap(User user) {
        return Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "username", user.getUserNameColumn() != null ? user.getUserNameColumn() : user.getEmail(),
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "addressText", user.getAddressText() != null ? user.getAddressText() : "",
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                "role", user.getRole().getName().toUpperCase());
    }

    public record CreateUserRequest(
            String email,
            String username,
            String password,
            String fullName,
            String phone,
            String addressText,
            String role) {
    }

    public record UpdateUserRequest(
            String email,
            String username,
            String password,
            String fullName,
            String phone,
            String addressText,
            String role) {
    }
}
