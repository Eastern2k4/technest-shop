package com.example.ecommerce.security;

import java.time.Instant;
import java.util.Date;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.ecommerce.user.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

@Service
public class JwtService {

    private final String secret;
    private SecretKey key;

    public JwtService(@Value("${app.jwt.secret:change-this-secret-to-64-bytes}") String secret) {
        this.secret = secret;
    }

    @PostConstruct
    public void initKey() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generate(User user, long ttlSeconds) {
        if (user.getRole() == null || user.getRole().getName() == null) {
            throw new IllegalStateException("User must have a role to generate JWT token");
        }
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claims(Map.of("role", user.getRole().getName(), "uid", user.getId()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(key)
                .compact();
    }

    public String getUsername(String token) {

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}
