package com.example.ecommerce.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.UserDtos.CreateUserRequest;
import com.example.ecommerce.dto.UserDtos.UpdateUserRequest;
import com.example.ecommerce.dto.UserDtos.UserResponse;
import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.user.Role;
import com.example.ecommerce.user.RoleRepository;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrderRepository orderRepository;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.orderRepository = orderRepository;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByOrderByIdAsc().stream()
                .map(this::toUserResponse)
                .toList();
    }

    public UserResponse getUser(Long id) {
        return toUserResponse(loadUser(id));
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        validateCreateRequest(request);
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
        }

        String username = normalize(request.username());
        if (username != null && userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already in use");
        }

        Role role = loadRole(request.role());

        User user = new User();
        user.setEmail(email);
        user.setUserNameColumn(username != null ? username : email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(normalize(request.fullName()));
        user.setPhone(normalize(request.phone()));
        user.setAddressText(normalize(request.addressText()));
        user.setRole(role);

        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = loadUser(id);

        String email = normalizeEmail(request.email());
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(email)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
            }
            user.setEmail(email);
        }

        String username = normalize(request.username());
        if (username != null && !username.equals(user.getUserNameColumn())) {
            if (userRepository.existsByUsername(username)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already in use");
            }
            user.setUserNameColumn(username);
        }

        if (normalize(request.password()) != null) {
            user.setPassword(passwordEncoder.encode(request.password().trim()));
        }
        if (request.fullName() != null) {
            user.setFullName(normalize(request.fullName()));
        }
        if (request.phone() != null) {
            user.setPhone(normalize(request.phone()));
        }
        if (request.addressText() != null) {
            user.setAddressText(normalize(request.addressText()));
        }
        if (normalize(request.role()) != null) {
            user.setRole(loadRole(request.role()));
        }

        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        orderRepository.deleteAll(orderRepository.findAllByUserId(id));
        userRepository.deleteById(id);
    }

    private User loadUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Role loadRole(String roleName) {
        String normalizedRole = normalize(roleName);
        if (normalizedRole == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
        }
        return roleRepository.findByName(normalizedRole.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid role: " + roleName));
    }

    private void validateCreateRequest(CreateUserRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User payload is required");
        }
        if (normalize(request.email()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (normalize(request.password()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
        if (normalize(request.role()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
        }
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUserNameColumn() != null ? user.getUserNameColumn() : user.getEmail(),
                user.getFullName() != null ? user.getFullName() : "",
                user.getPhone() != null ? user.getPhone() : "",
                user.getAddressText() != null ? user.getAddressText() : "",
                user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                user.getRole().getName().toUpperCase());
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeEmail(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toLowerCase();
    }
}
