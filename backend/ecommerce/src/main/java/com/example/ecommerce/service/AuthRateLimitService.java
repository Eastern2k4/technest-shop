package com.example.ecommerce.service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthRateLimitService {
    private final int maxAttempts;
    private final long blockSeconds;
    private final ConcurrentHashMap<String, AttemptWindow> loginAttempts = new ConcurrentHashMap<>();

    public AuthRateLimitService(
            @Value("${app.auth.rate-limit.max-attempts:5}") int maxAttempts,
            @Value("${app.auth.rate-limit.block-seconds:900}") long blockSeconds) {
        this.maxAttempts = maxAttempts;
        this.blockSeconds = blockSeconds;
    }

    @PostConstruct
    public void validateConfig() {
        if (maxAttempts < 1) {
            throw new IllegalStateException("app.auth.rate-limit.max-attempts must be at least 1");
        }
        if (blockSeconds < 1) {
            throw new IllegalStateException("app.auth.rate-limit.block-seconds must be at least 1");
        }
    }

    public void assertLoginAllowed(String key) {
        AttemptWindow attemptWindow = loginAttempts.get(key);
        if (attemptWindow == null) {
            return;
        }

        Instant now = Instant.now();
        if (attemptWindow.blockedUntil != null && attemptWindow.blockedUntil.isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Too many login attempts. Please try again later.");
        }

        if (attemptWindow.blockedUntil != null && !attemptWindow.blockedUntil.isAfter(now)) {
            loginAttempts.remove(key);
        }
    }

    public void recordLoginFailure(String key) {
        loginAttempts.compute(key, (ignored, current) -> {
            Instant now = Instant.now();
            AttemptWindow next = current == null ? new AttemptWindow() : current;

            if (next.blockedUntil != null && !next.blockedUntil.isAfter(now)) {
                next = new AttemptWindow();
            }

            next.failures += 1;
            if (next.failures >= maxAttempts) {
                next.blockedUntil = now.plusSeconds(blockSeconds);
            }
            return next;
        });
    }

    public void recordLoginSuccess(String key) {
        loginAttempts.remove(key);
    }

    public void clear() {
        loginAttempts.clear();
    }

    private static final class AttemptWindow {
        private int failures;
        private Instant blockedUntil;
    }
}
