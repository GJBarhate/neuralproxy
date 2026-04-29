package com.neuralproxy.playground;

import com.neuralproxy.analytics.AnalyticsService;
import com.neuralproxy.common.TenantAccess;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/playground")
public class PlaygroundController {

    private final AnalyticsService analyticsService;
    private final JdbcTemplate jdbcTemplate;

    public PlaygroundController(AnalyticsService analyticsService, JdbcTemplate jdbcTemplate) {
        this.analyticsService = analyticsService;
        this.jdbcTemplate = jdbcTemplate;
    }

    record SavedPromptRequest(String title, String prompt, String tags) {}

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(@RequestParam(defaultValue = "25") int limit,
                                                                Authentication auth,
                                                                HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        return ResponseEntity.ok(analyticsService.getRecentRequestsForTenant(tenantId, limit).stream().map(com.neuralproxy.analytics.RequestLogMapper::toMap).toList());
    }

    @GetMapping("/saved-prompts")
    public ResponseEntity<List<Map<String, Object>>> getSavedPrompts(Authentication auth, HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        return ResponseEntity.ok(jdbcTemplate.queryForList(
            "SELECT id, title, prompt, tags, created_at, updated_at FROM saved_prompts WHERE tenant_id = ?::uuid ORDER BY updated_at DESC",
            tenantId.toString()
        ));
    }

    @PostMapping("/saved-prompts")
    public ResponseEntity<Map<String, Object>> createSavedPrompt(@RequestBody SavedPromptRequest req,
                                                                 Authentication auth,
                                                                 HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO saved_prompts(id, tenant_id, title, prompt, tags) VALUES(?::uuid, ?::uuid, ?, ?, ?)",
            id.toString(), tenantId.toString(), req.title(), req.prompt(), req.tags()
        );
        return ResponseEntity.ok(Map.of("id", id, "success", true));
    }

    @PutMapping("/saved-prompts/{id}")
    public ResponseEntity<Map<String, Object>> updateSavedPrompt(@PathVariable UUID id,
                                                                 @RequestBody SavedPromptRequest req,
                                                                 Authentication auth,
                                                                 HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        jdbcTemplate.update(
            "UPDATE saved_prompts SET title = ?, prompt = ?, tags = ?, updated_at = NOW() WHERE id = ?::uuid AND tenant_id = ?::uuid",
            req.title(), req.prompt(), req.tags(), id.toString(), tenantId.toString()
        );
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/saved-prompts/{id}")
    public ResponseEntity<Map<String, Object>> deleteSavedPrompt(@PathVariable UUID id,
                                                                 Authentication auth,
                                                                 HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        jdbcTemplate.update("DELETE FROM saved_prompts WHERE id = ?::uuid AND tenant_id = ?::uuid", id.toString(), tenantId.toString());
        return ResponseEntity.ok(Map.of("success", true));
    }
}
