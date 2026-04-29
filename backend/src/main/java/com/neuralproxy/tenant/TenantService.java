package com.neuralproxy.tenant;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class TenantService {

    private final TenantRepository tenantRepo;
    private final JdbcTemplate jdbcTemplate;

    public TenantService(TenantRepository tenantRepo, JdbcTemplate jdbcTemplate) {
        this.tenantRepo = tenantRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Tenant> getAllTenants() {
        return tenantRepo.findAll();
    }

    public Tenant createTenant(String name, String plan) {
        Tenant t = new Tenant();
        t.setId(UUID.randomUUID());
        t.setName(name);
        t.setPlan(plan);
        t.setActive(true);
        if ("FREE".equalsIgnoreCase(plan)) {
            t.setSubscriptionStatus("FREE");
        } else {
            t.setSubscriptionStatus("ACTIVE");
            t.setPlanStartedAt(LocalDateTime.now());
            t.setBillingCycleEnd(LocalDateTime.now().plusDays(30));
        }
        return tenantRepo.save(t);
    }

    public Tenant getTenant(UUID tenantId) {
        return tenantRepo.findById(tenantId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Tenant not found"));
    }

    public Map<String, Object> generateApiKey(UUID tenantId) {
        return generateApiKey(tenantId, "Primary key", 90);
    }

    public Map<String, Object> generateApiKey(UUID tenantId, String label, Integer expiresInDays) {
        String raw = "np_" + UUID.randomUUID().toString().replace("-", "");
        String keyHash = sha256Hex(raw);
        String keyPrefix = raw.substring(0, Math.min(8, raw.length()));
        OffsetDateTime expiresAt = expiresInDays == null ? null : OffsetDateTime.now().plusDays(Math.max(1, expiresInDays));

        jdbcTemplate.update(
            "INSERT INTO api_keys(id, key_hash, key_prefix, tenant_id, active, label, expires_at) VALUES(?::uuid, ?, ?, ?::uuid, true, ?, ?)",
            UUID.randomUUID().toString(), keyHash, keyPrefix, tenantId.toString(), label, expiresAt
        );

        Map<String, Object> result = new HashMap<>();
        result.put("key", raw);
        result.put("keyPrefix", keyPrefix);
        result.put("tenantId", tenantId);
        result.put("label", label);
        result.put("expiresAt", expiresAt);
        return result;
    }

    public List<Map<String, Object>> getApiKeysForTenant(UUID tenantId) {
        return jdbcTemplate.queryForList(
            "SELECT id, key_prefix, active, label, created_at, expires_at, last_used_at, revoked_at, " +
                "CASE " +
                "WHEN revoked_at IS NOT NULL THEN 'REVOKED' " +
                "WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'EXPIRED' " +
                "WHEN active = false THEN 'INACTIVE' " +
                "ELSE 'ACTIVE' END AS status " +
                "FROM api_keys WHERE tenant_id=?::uuid ORDER BY created_at DESC",
            tenantId.toString()
        );
    }

    public Map<String, Object> revokeApiKey(UUID tenantId, UUID keyId) {
        int updated = jdbcTemplate.update(
            "UPDATE api_keys SET active = false, revoked_at = NOW() WHERE id = ?::uuid AND tenant_id = ?::uuid",
            keyId.toString(), tenantId.toString()
        );
        if (updated == 0) {
            throw new ResponseStatusException(NOT_FOUND, "API key not found");
        }
        return Map.of("success", true, "keyId", keyId, "status", "REVOKED");
    }

    public Map<String, Object> rotateApiKey(UUID tenantId, UUID keyId) {
        revokeApiKey(tenantId, keyId);
        return generateApiKey(tenantId, "Rotated key", 90);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
