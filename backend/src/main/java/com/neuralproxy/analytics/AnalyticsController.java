package com.neuralproxy.analytics;

import com.neuralproxy.common.TenantAccess;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }

    @GetMapping("/admin-home")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminHome() {
        return ResponseEntity.ok(analyticsService.getAdminHomeSnapshot());
    }

    @GetMapping("/my/summary")
    public ResponseEntity<Map<String, Object>> getMySummary(Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(analyticsService.getSummaryForTenant(TenantAccess.extractTenantId(auth, request)));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<RequestLog>> getRequests(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(analyticsService.getRecentRequests(limit));
    }

    @GetMapping("/my/requests")
    public ResponseEntity<List<Map<String, Object>>> getMyRequests(@RequestParam(defaultValue = "20") int limit,
                                                                   Authentication auth,
                                                                   HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        return ResponseEntity.ok(analyticsService.getRecentRequestsForTenant(tenantId, limit).stream().map(RequestLogMapper::toMap).toList());
    }

    @GetMapping("/cost-over-time")
    public ResponseEntity<List<Map<String, Object>>> getCostOverTime() {
        return ResponseEntity.ok(analyticsService.getCostOverTime());
    }

    @GetMapping("/my/cost-over-time")
    public ResponseEntity<List<Map<String, Object>>> getMyCostOverTime(Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(analyticsService.getCostOverTimeForTenant(TenantAccess.extractTenantId(auth, request)));
    }

    @GetMapping("/key-source-breakdown")
    public ResponseEntity<Map<String, Long>> getKeySourceBreakdown() {
        return ResponseEntity.ok(analyticsService.getKeySourceBreakdown());
    }

    @GetMapping("/my/key-source-breakdown")
    public ResponseEntity<Map<String, Long>> getMyKeySourceBreakdown(Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(analyticsService.getKeySourceBreakdownForTenant(TenantAccess.extractTenantId(auth, request)));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<Map<String, Object>> getRequestDetails(@PathVariable UUID id,
                                                                 Authentication auth,
                                                                 HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        boolean admin = TenantAccess.isAdmin(auth);
        return ResponseEntity.ok(analyticsService.getRequestDetails(id, tenantId, admin));
    }
}
