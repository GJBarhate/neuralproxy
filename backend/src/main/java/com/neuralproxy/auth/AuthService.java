package com.neuralproxy.auth;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final JdbcTemplate jdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(JdbcTemplate jdbcTemplate,
                       BCryptPasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public Map<String, Object> login(String email, String password) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, password_hash, role, tenant_id, username FROM users WHERE email=?",
            email
        );

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        Map<String, Object> user = rows.get(0);
        String passwordHash = (String) user.get("password_hash");

        if (!passwordEncoder.matches(password, passwordHash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String role = (String) user.get("role");
        String tenantId = user.get("tenant_id").toString();
        String username = (String) user.get("username");
        String token = jwtUtil.generateToken(email, role, tenantId);

        return Map.of(
            "token", token,
            "email", email,
            "username", username,
            "role", role,
            "tenantId", tenantId
        );
    }

    public Map<String, Object> register(String email, String password, String username, String tenantId) {
        try {
            // Check if email already exists
            List<Map<String, Object>> existingUser = jdbcTemplate.queryForList(
                "SELECT id FROM users WHERE email = ?",
                email
            );
            if (!existingUser.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            }
            
            // Validate tenant ID format
            try {
                UUID.fromString(tenantId);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tenant ID format");
            }
            
            // Create tenant first
            jdbcTemplate.update(
                "INSERT INTO tenants(id, name, plan, active) VALUES(?::uuid, ?, 'FREE', true) ON CONFLICT DO NOTHING",
                tenantId, email + "'s workspace"
            );
            
            // Create user
            String hash = passwordEncoder.encode(password);
            UUID userId = UUID.randomUUID();

            jdbcTemplate.update(
                "INSERT INTO users(id, email, username, password_hash, role, tenant_id) VALUES(?::uuid, ?, ?, ?, 'USER', ?::uuid)",
                userId.toString(), email, username, hash, tenantId
            );

            String token = jwtUtil.generateToken(email, "USER", tenantId);

            return Map.of(
                "token", token,
                "email", email,
                "username", username,
                "role", "USER",
                "tenantId", tenantId
            );
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration failed: " + e.getMessage());
        }
    }

    public Map<String, Object> makeAdmin(String email) {
        try {
            int updated = jdbcTemplate.update(
                "UPDATE users SET role = 'ADMIN' WHERE email = ?",
                email
            );
            
            if (updated == 0) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }

            return Map.of(
                "message", "User promoted to ADMIN successfully",
                "email", email,
                "role", "ADMIN"
            );
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to promote user: " + e.getMessage());
        }
    }

    public Map<String, Object> requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id FROM users WHERE email = ?",
            normalizedEmail
        );

        if (rows.isEmpty()) {
            return Map.of("message", "If an account exists for that email, a reset link has been prepared.");
        }

        String userId = String.valueOf(rows.get(0).get("id"));
        String token = UUID.randomUUID() + "-" + UUID.randomUUID();

        jdbcTemplate.update(
            "UPDATE password_reset_tokens SET consumed_at = NOW() WHERE user_id = ?::uuid AND consumed_at IS NULL",
            userId
        );
        jdbcTemplate.update(
            "INSERT INTO password_reset_tokens(id, user_id, token, expires_at) VALUES(gen_random_uuid(), ?::uuid, ?, NOW() + INTERVAL '30 minutes')",
            userId,
            token
        );

        return Map.of(
            "message", "Reset link ready. In production, email delivery should send this link.",
            "resetToken", token,
            "resetUrl", "/reset-password?token=" + token
        );
    }

    public Map<String, Object> resetPassword(String token, String password) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token is required");
        }
        if (password == null || password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT user_id FROM password_reset_tokens WHERE token = ? AND consumed_at IS NULL AND expires_at > NOW()",
            token.trim()
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset link is invalid or expired");
        }

        String userId = String.valueOf(rows.get(0).get("user_id"));
        String newHash = passwordEncoder.encode(password);

        jdbcTemplate.update(
            "UPDATE users SET password_hash = ? WHERE id = ?::uuid",
            newHash,
            userId
        );
        jdbcTemplate.update(
            "UPDATE password_reset_tokens SET consumed_at = NOW() WHERE token = ?",
            token.trim()
        );

        return Map.of("message", "Password reset successfully");
    }
}
