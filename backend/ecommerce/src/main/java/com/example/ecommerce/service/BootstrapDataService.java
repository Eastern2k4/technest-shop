package com.example.ecommerce.service;

import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.user.Role;
import com.example.ecommerce.user.RoleRepository;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;

@Service
public class BootstrapDataService implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(BootstrapDataService.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String bootstrapAdminEmail;
    private final String bootstrapAdminPassword;
    private final String bootstrapAdminFullName;

    public BootstrapDataService(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.admin.email:}") String bootstrapAdminEmail,
            @Value("${app.bootstrap.admin.password:}") String bootstrapAdminPassword,
            @Value("${app.bootstrap.admin.full-name:TechNest Admin}") String bootstrapAdminFullName) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapAdminEmail = bootstrapAdminEmail;
        this.bootstrapAdminPassword = bootstrapAdminPassword;
        this.bootstrapAdminFullName = bootstrapAdminFullName;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role customerRole = ensureRole("customer");
        ensureRole("staff");
        Role adminRole = ensureRole("admin");

        if (!customerRole.getName().equals("customer")) {
            throw new IllegalStateException("Role bootstrap failed");
        }

        ensureBootstrapAdmin(adminRole);
    }

    private Role ensureRole(String name) {
        return roleRepository.findByName(name)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(name);
                    Role saved = roleRepository.save(role);
                    log.info("Created bootstrap role '{}'", name);
                    return saved;
                });
    }

    private void ensureBootstrapAdmin(Role adminRole) {
        String email = normalizeEmail(bootstrapAdminEmail);
        String password = normalize(bootstrapAdminPassword);
        if (email == null && password == null) {
            return;
        }
        if (email == null || password == null) {
            throw new IllegalStateException(
                    "app.bootstrap.admin.email and app.bootstrap.admin.password must be provided together");
        }
        if (password.length() < 12) {
            throw new IllegalStateException("Bootstrap admin password must be at least 12 characters");
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        boolean isNewUser = user.getId() == null;

        user.setEmail(email);
        user.setUserNameColumn(
                user.getUserNameColumn() != null && !user.getUserNameColumn().isBlank()
                        ? user.getUserNameColumn()
                        : email);
        user.setFullName(normalize(bootstrapAdminFullName) != null ? normalize(bootstrapAdminFullName) : "TechNest Admin");
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(adminRole);
        userRepository.save(user);

        if (isNewUser) {
            log.warn("Created bootstrap admin user '{}'. Rotate credentials after first login.", email);
        } else {
            log.warn("Updated bootstrap admin user '{}' from environment configuration.", email);
        }
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
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }
}
