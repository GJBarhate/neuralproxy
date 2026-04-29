package com.neuralproxy.tenant;

import com.neuralproxy.analytics.AnalyticsService;
import com.neuralproxy.billing.BillingService;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class TenantOverviewService {

    private final TenantService tenantService;
    private final AnalyticsService analyticsService;
    private final BillingService billingService;

    public TenantOverviewService(TenantService tenantService, AnalyticsService analyticsService, BillingService billingService) {
        this.tenantService = tenantService;
        this.analyticsService = analyticsService;
        this.billingService = billingService;
    }

    public Map<String, Object> getTenantOverview(UUID tenantId) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tenant", tenantService.getTenant(tenantId));
        result.put("keys", tenantService.getApiKeysForTenant(tenantId));
        result.put("subscription", billingService.getCurrentSubscription(tenantId));
        result.putAll(analyticsService.getTenantDetailOverview(tenantId));
        return result;
    }
}
