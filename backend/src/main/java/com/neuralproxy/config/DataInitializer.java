package com.neuralproxy.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import com.neuralproxy.cache.RedisCacheService;

import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private static final String ADMIN_TENANT_ID = "00000000-0000-0000-0000-000000000001";
    private static final String LEGACY_ADMIN_EMAIL = "admin@neuralproxy.dev";
    private static final String ADMIN_EMAIL = "gauravjbarhate554@gmail.com";
    private static final String ADMIN_USERNAME = "gaurav";
    private static final String ADMIN_PASSWORD = "Gaurav@05";

    private final JdbcTemplate jdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder;
    private final RedisCacheService redisCacheService;

    public DataInitializer(JdbcTemplate jdbcTemplate,
                           BCryptPasswordEncoder passwordEncoder,
                           RedisCacheService redisCacheService) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.redisCacheService = redisCacheService;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureAdminTenant();
        ensureAdminUser();
        redisCacheService.clearProjectCache();
        log.info("DataInitializer: default admin verified and project cache cleared");
    }

    private void ensureAdminTenant() {
        jdbcTemplate.update(
            "INSERT INTO tenants (id, name, plan, active, subscription_status, plan_started_at, billing_cycle_end) " +
                "VALUES (?::uuid, 'NeuralProxy Admin', 'PRO', true, 'ACTIVE', NOW(), NOW() + INTERVAL '30 days') ON CONFLICT (id) DO NOTHING",
            ADMIN_TENANT_ID
        );
        jdbcTemplate.update(
            "UPDATE tenants SET plan = COALESCE(plan, 'PRO'), subscription_status = COALESCE(subscription_status, 'ACTIVE'), " +
                "plan_started_at = COALESCE(plan_started_at, NOW()), billing_cycle_end = COALESCE(billing_cycle_end, NOW() + INTERVAL '30 days') " +
                "WHERE id = ?::uuid",
            ADMIN_TENANT_ID
        );
    }

    private void ensureAdminUser() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, password_hash, username FROM users WHERE email = ?",
            ADMIN_EMAIL
        );

        String newHash = passwordEncoder.encode(ADMIN_PASSWORD);

        if (rows.isEmpty()) {
            List<Map<String, Object>> legacyRows = jdbcTemplate.queryForList(
                "SELECT id, username FROM users WHERE email = ?",
                LEGACY_ADMIN_EMAIL
            );

            if (!legacyRows.isEmpty()) {
                String resolvedUsername = resolveUsernameForEmail(ADMIN_EMAIL, String.valueOf(legacyRows.get(0).get("username")));
                jdbcTemplate.update(
                    "UPDATE users SET email = ?, username = ?, password_hash = ?, role = 'ADMIN', tenant_id = ?::uuid WHERE email = ?",
                    ADMIN_EMAIL,
                    resolvedUsername,
                    newHash,
                    ADMIN_TENANT_ID,
                    LEGACY_ADMIN_EMAIL
                );
                return;
            }
        }

        if (rows.isEmpty()) {
            String resolvedUsername = resolveUsernameForEmail(ADMIN_EMAIL, ADMIN_USERNAME);
            jdbcTemplate.update(
                "INSERT INTO users (id, email, username, password_hash, role, tenant_id) VALUES (gen_random_uuid(), ?, ?, ?, 'ADMIN', ?::uuid)",
                ADMIN_EMAIL,
                resolvedUsername,
                newHash,
                ADMIN_TENANT_ID
            );
            return;
        }

        String currentHash = String.valueOf(rows.get(0).get("password_hash"));
        String existingUsername = String.valueOf(rows.get(0).get("username"));
        if (!passwordEncoder.matches(ADMIN_PASSWORD, currentHash)) {
            String resolvedUsername = resolveUsernameForEmail(ADMIN_EMAIL, existingUsername);
            jdbcTemplate.update(
                "UPDATE users SET password_hash = ?, username = ?, role = 'ADMIN', tenant_id = ?::uuid WHERE email = ?",
                newHash,
                resolvedUsername,
                ADMIN_TENANT_ID,
                ADMIN_EMAIL
            );
        }
    }

    private String resolveUsernameForEmail(String email, String fallbackUsername) {
        String preferred = (fallbackUsername == null || fallbackUsername.isBlank()) ? ADMIN_USERNAME : fallbackUsername.trim();
        List<Map<String, Object>> preferredOwner = jdbcTemplate.queryForList(
            "SELECT email FROM users WHERE username = ?",
            preferred
        );

        if (preferredOwner.isEmpty() || email.equalsIgnoreCase(String.valueOf(preferredOwner.get(0).get("email")))) {
            return preferred;
        }

        String localPart = email.split("@")[0].replaceAll("[^a-zA-Z0-9._-]", "");
        if (localPart.isBlank()) {
            localPart = "admin";
        }

        List<Map<String, Object>> localPartOwner = jdbcTemplate.queryForList(
            "SELECT email FROM users WHERE username = ?",
            localPart
        );
        if (localPartOwner.isEmpty() || email.equalsIgnoreCase(String.valueOf(localPartOwner.get(0).get("email")))) {
            return localPart;
        }

        return localPart + "_admin";
    }
}
