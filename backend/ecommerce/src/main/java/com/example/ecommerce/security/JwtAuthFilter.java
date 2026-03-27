package com.example.ecommerce.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

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

        String header = req.getHeader("Authorization");

        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                String username = jwt.getUsername(token);
                if (SecurityContextHolder.getContext().getAuthentication() != null) {
                    chain.doFilter(req, res);
                    return;
                }
                var user = users.findByEmailIgnoreCase(username).orElse(null);
                if (user != null) {
                    if (user.getRole() == null) {
                        log.warn("Authenticated user {} has no role assigned", username);
                        SecurityContextHolder.clearContext();
                        chain.doFilter(req, res);
                        return;
                    }

                    var authorities = user.getAuthorities();
                    if (authorities == null || authorities.isEmpty()) {
                        log.warn("Authenticated user {} has no authorities", username);
                        SecurityContextHolder.clearContext();
                        chain.doFilter(req, res);
                        return;
                    }

                    var auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    log.debug("JWT authentication set for {}", username);
                } else {
                    log.debug("JWT subject {} not found in database", username);
                    SecurityContextHolder.clearContext();
                }
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                SecurityContextHolder.clearContext();
                log.debug("Expired JWT token");
            } catch (io.jsonwebtoken.security.SignatureException | io.jsonwebtoken.MalformedJwtException e) {
                SecurityContextHolder.clearContext();
                log.debug("Invalid JWT token");
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                log.warn("JWT processing error", e);
            }
        }

        chain.doFilter(req, res);
    }
}
