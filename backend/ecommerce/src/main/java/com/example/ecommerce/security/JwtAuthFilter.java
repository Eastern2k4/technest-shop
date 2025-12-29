package com.example.ecommerce.security;

import java.io.IOException;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.ecommerce.user.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwt, UserRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest req,
            @NonNull HttpServletResponse res,
            @NonNull FilterChain chain) throws ServletException, IOException {

        // Always process JWT token if present, even for public endpoints
        // This allows authenticated users to access public endpoints with their
        // identity
        String header = req.getHeader("Authorization");
        String requestPath = req.getRequestURI();

        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                String username = jwt.getUsername(token);
                System.out
                        .println("[JwtAuthFilter] Processing token for user: " + username + " on path: " + requestPath);
                var user = users.findByEmail(username).orElse(null);
                if (user != null) {
                    // Verify role is loaded and valid
                    if (user.getRole() == null) {
                        System.err.println("[JwtAuthFilter] ERROR: User " + username + " has no role assigned");
                        SecurityContextHolder.clearContext();
                        chain.doFilter(req, res);
                        return;
                    }

                    System.out.println("[JwtAuthFilter] User role: " + user.getRole().getName());

                    // Always set authentication if user is found, even if already set
                    // This ensures the authentication is fresh
                    var authorities = user.getAuthorities();
                    if (authorities == null || authorities.isEmpty()) {
                        System.err.println("[JwtAuthFilter] ERROR: User " + username + " has no authorities");
                        SecurityContextHolder.clearContext();
                        chain.doFilter(req, res);
                        return;
                    }

                    System.out.println("[JwtAuthFilter] User authorities: " + authorities);

                    var auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    System.out.println("[JwtAuthFilter] Authentication set successfully for user: " + username);
                } else {
                    // User not found - clear context
                    System.err.println("[JwtAuthFilter] ERROR: User not found for email: " + username);
                    SecurityContextHolder.clearContext();
                }
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                // Token expired - clear any existing authentication
                SecurityContextHolder.clearContext();
                // Log for debugging but don't throw - let Spring Security handle it
                System.err.println("[JwtAuthFilter] ERROR: JWT token expired: " + e.getMessage());
            } catch (io.jsonwebtoken.security.SignatureException | io.jsonwebtoken.MalformedJwtException e) {
                // Invalid token signature or format
                SecurityContextHolder.clearContext();
                System.err.println("[JwtAuthFilter] ERROR: Invalid JWT token: " + e.getMessage());
            } catch (Exception e) {
                // Other errors - clear context and log
                SecurityContextHolder.clearContext();
                System.err.println("[JwtAuthFilter] ERROR: JWT processing error: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            // No Authorization header
            if (requestPath.contains("/api/orders") && "POST".equals(req.getMethod())) {
                System.err.println("[JwtAuthFilter] WARNING: No Authorization header for POST /api/orders");
            }
        }

        // Always continue the filter chain - let Spring Security handle authorization
        chain.doFilter(req, res);
    }
}
