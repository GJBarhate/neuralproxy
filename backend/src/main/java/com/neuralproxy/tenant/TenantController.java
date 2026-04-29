package com.neuralproxy.tenant;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tenants")
@PreAuthorize("hasRole('ADMIN')")
public class TenantController {

    private final TenantService tenantService;
    private final TenantOverviewService tenantOverviewService;

    public TenantController(TenantService tenantService, TenantOverviewService tenantOverviewService) {
        this.tenantService = tenantService;
        this.tenantOverviewService = tenantOverviewService;
    }

    record CreateTenantRequest(String name, String plan) {}
    record CreateApiKeyRequest(String label, Integer expiresInDays) {}

    @GetMapping
    public ResponseEntity<List<Tenant>> getAllTenants() {
        return ResponseEntity.ok(tenantService.getAllTenants());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTenantOverview(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantOverviewService.getTenantOverview(id));
    }

    @PostMapping
    public ResponseEntity<Tenant> createTenant(@RequestBody CreateTenantRequest req) {
        return ResponseEntity.ok(tenantService.createTenant(req.name(), req.plan()));
    }

    @PostMapping("/{id}/api-keys")
    public ResponseEntity<Map<String, Object>> generateApiKey(@PathVariable UUID id,
                                                              @RequestBody(required = false) CreateApiKeyRequest req) {
        String label = req == null || req.label() == null || req.label().isBlank() ? "Primary key" : req.label();
        Integer expiresInDays = req == null ? 90 : req.expiresInDays();
        return ResponseEntity.ok(tenantService.generateApiKey(id, label, expiresInDays));
    }

    @GetMapping("/{id}/api-keys")
    public ResponseEntity<List<Map<String, Object>>> getApiKeys(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.getApiKeysForTenant(id));
    }

    @PatchMapping("/{id}/api-keys/{keyId}/revoke")
    public ResponseEntity<Map<String, Object>> revokeApiKey(@PathVariable UUID id, @PathVariable UUID keyId) {
        return ResponseEntity.ok(tenantService.revokeApiKey(id, keyId));
    }

    @PostMapping("/{id}/api-keys/{keyId}/rotate")
    public ResponseEntity<Map<String, Object>> rotateApiKey(@PathVariable UUID id, @PathVariable UUID keyId) {
        return ResponseEntity.ok(tenantService.rotateApiKey(id, keyId));
    }
}
