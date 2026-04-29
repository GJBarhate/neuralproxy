package com.neuralproxy.account;

import com.neuralproxy.auth.JwtUtil;
import com.neuralproxy.common.TenantAccess;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AccountService {

    private final JdbcTemplate jdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AccountService(JdbcTemplate jdbcTemplate, BCryptPasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public Map<String, Object> getProfile(Authentication auth, HttpServletRequest request) {
        String email = requireEmail(auth);
        UUID tenantId = TenantAccess.extractTenantId(auth, request);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT u.id, u.email, u.username, u.role, u.created_at, t.name AS tenant_name, t.plan, t.active " +
                "FROM users u LEFT JOIN tenants t ON t.id = u.tenant_id WHERE u.email = ?",
            email
        );

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found");
        }

        Map<String, Object> user = rows.get(0);
        Integer activeKeys = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM api_keys WHERE tenant_id = ?::uuid AND active = true",
            Integer.class,
            tenantId.toString()
        );

        Integer savedPrompts = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM saved_prompts WHERE tenant_id = ?::uuid",
            Integer.class,
            tenantId.toString()
        );

        return Map.of(
            "email", user.get("email"),
            "username", user.get("username"),
            "role", user.get("role"),
            "createdAt", user.get("created_at"),
            "tenantName", user.get("tenant_name"),
            "plan", user.get("plan"),
            "workspaceActive", user.get("active"),
            "activeApiKeys", activeKeys == null ? 0 : activeKeys,
            "savedPrompts", savedPrompts == null ? 0 : savedPrompts
        );
    }

    public Map<String, Object> updateProfile(Authentication auth,
                                             HttpServletRequest request,
                                             String newEmail,
                                             String username) {
        String currentEmail = requireEmail(auth);
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        String role = auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority())) ? "ADMIN" : "USER";

        String cleanEmail = normalizeEmail(newEmail);
        String cleanUsername = normalizeUsername(username);

        List<Map<String, Object>> existing = jdbcTemplate.queryForList(
            "SELECT id FROM users WHERE email = ? AND email <> ?",
            cleanEmail,
            currentEmail
        );
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        jdbcTemplate.update(
            "UPDATE users SET email = ?, username = ? WHERE email = ?",
            cleanEmail,
            cleanUsername,
            currentEmail
        );

        return Map.of(
            "message", "Profile updated successfully",
            "email", cleanEmail,
            "username", cleanUsername,
            "role", role,
            "tenantId", tenantId.toString(),
            "token", jwtUtil.generateToken(cleanEmail, role, tenantId.toString())
        );
    }

    public Map<String, Object> changePassword(Authentication auth, String currentPassword, String newPassword) {
        String email = requireEmail(auth);
        if (currentPassword == null || currentPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both current and new password are required");
        }
        if (newPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 6 characters");
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT password_hash FROM users WHERE email = ?",
            email
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found");
        }

        String currentHash = String.valueOf(rows.get(0).get("password_hash"));
        if (!passwordEncoder.matches(currentPassword, currentHash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        jdbcTemplate.update(
            "UPDATE users SET password_hash = ? WHERE email = ?",
            passwordEncoder.encode(newPassword),
            email
        );

        return Map.of("message", "Password updated successfully");
    }

    public List<Map<String, Object>> getRecentActivity(Authentication auth, HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        List<Map<String, Object>> items = new ArrayList<>();

        List<Map<String, Object>> recentRequests = jdbcTemplate.queryForList(
            "SELECT provider, cache_hit, created_at, latency_ms FROM request_logs WHERE tenant_id = ?::uuid ORDER BY created_at DESC LIMIT 4",
            tenantId.toString()
        );
        for (Map<String, Object> row : recentRequests) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("type", "request");
            item.put("title", "Prompt request completed");
            item.put("detail", row.get("provider") + " response" + (Boolean.TRUE.equals(row.get("cache_hit")) ? " from cache" : " served live"));
            item.put("timestamp", row.get("created_at"));
            item.put("tone", Boolean.TRUE.equals(row.get("cache_hit")) ? "positive" : "neutral");
            items.add(item);
        }

        List<Map<String, Object>> recentPayments = jdbcTemplate.queryForList(
            "SELECT plan_code, status, created_at FROM billing_payments WHERE tenant_id = ?::uuid ORDER BY created_at DESC LIMIT 2",
            tenantId.toString()
        );
        for (Map<String, Object> row : recentPayments) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("type", "billing");
            item.put("title", "Billing event");
            item.put("detail", row.get("plan_code") + " payment is " + row.get("status"));
            item.put("timestamp", row.get("created_at"));
            item.put("tone", "SUCCESS".equals(String.valueOf(row.get("status"))) ? "positive" : "warning");
            items.add(item);
        }

        items.sort((left, right) -> {
            Instant leftTime = toInstant(left.get("timestamp"));
            Instant rightTime = toInstant(right.get("timestamp"));
            return rightTime.compareTo(leftTime);
        });
        return items;
    }

    private String requireEmail(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return auth.getName();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        return email.trim().toLowerCase();
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        String cleaned = username.trim();
        if (cleaned.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username must be at least 3 characters");
        }
        return cleaned;
    }

    private Instant toInstant(Object value) {
        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant();
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        return Instant.EPOCH;
    }
}
