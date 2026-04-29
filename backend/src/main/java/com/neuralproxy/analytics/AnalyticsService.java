package com.neuralproxy.analytics;

import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final RequestLogRepository repo;
    private final JdbcTemplate jdbcTemplate;

    public AnalyticsService(RequestLogRepository repo, JdbcTemplate jdbcTemplate) {
        this.repo = repo;
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> getSummary() {
        return buildSummary(
            repo.countAll(),
            repo.countCacheHits(),
            repo.avgLatency(),
            repo.totalCost(),
            repo.totalTokens(),
            repo.countErrors(),
            repo.countLiveRequests()
        );
    }

    public Map<String, Object> getSummaryForTenant(UUID tenantId) {
        return buildSummary(
            repo.countAllByTenant(tenantId),
            repo.countCacheHitsByTenant(tenantId),
            repo.avgLatencyByTenant(tenantId),
            repo.totalCostByTenant(tenantId),
            repo.totalTokensByTenant(tenantId),
            repo.countErrorsByTenant(tenantId),
            repo.countLiveRequestsByTenant(tenantId)
        );
    }

    public List<RequestLog> getRecentRequests(int limit) {
        int normalizedLimit = Math.max(1, Math.min(limit, 100));
        return repo.findByOrderByCreatedAtDesc(PageRequest.of(0, normalizedLimit));
    }

    public List<Map<String, Object>> getCostOverTime() {
        return mapCostRows(repo.getCostOverTime());
    }

    public List<Map<String, Object>> getCostOverTimeForTenant(UUID tenantId) {
        return mapCostRows(repo.getCostOverTimeByTenant(tenantId));
    }

    public Map<String, Long> getKeySourceBreakdown() {
        Map<String, Long> result = new HashMap<>();
        result.put("user", repo.countUserKeyRequests());
        result.put("system", repo.countSystemKeyRequests());
        return result;
    }

    public Map<String, Long> getKeySourceBreakdownForTenant(UUID tenantId) {
        Map<String, Long> result = new HashMap<>();
        result.put("user", repo.countUserKeyRequestsByTenant(tenantId));
        result.put("system", repo.countSystemKeyRequestsByTenant(tenantId));
        return result;
    }

    public List<RequestLog> getRecentRequestsForTenant(UUID tenantId, int limit) {
        int normalizedLimit = Math.max(1, Math.min(limit, 100));
        return repo.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(0, normalizedLimit));
    }

    public Map<String, Object> getRequestDetails(UUID requestId, UUID tenantId, boolean admin) {
        RequestLog log = admin
            ? repo.findById(requestId).orElseThrow(() -> new IllegalArgumentException("Request not found"))
            : repo.findByIdAndTenantId(requestId, tenantId).orElseThrow(() -> new IllegalArgumentException("Request not found"));

        return RequestLogMapper.toMap(log);
    }

    public Map<String, Object> getTenantDetailOverview(UUID tenantId) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", getSummaryForTenant(tenantId));
        result.put("costOverTime", getCostOverTimeForTenant(tenantId));
        result.put("keySourceBreakdown", getKeySourceBreakdownForTenant(tenantId));
        result.put("recentRequests", getRecentRequestsForTenant(tenantId, 10).stream().map(RequestLogMapper::toMap).toList());
        return result;
    }

    public Map<String, Object> getAdminHomeSnapshot() {
        Map<String, Object> result = new LinkedHashMap<>();
        long currentWindow = countRequestsSinceDays(7, 0);
        long previousWindow = countRequestsSinceDays(14, 7);
        double usageGrowth = growthPercent(currentWindow, previousWindow);

        Number currentCacheHitRate = jdbcTemplate.query(
            "SELECT COALESCE(ROUND(AVG(CASE WHEN cache_hit THEN 100.0 ELSE 0.0 END), 1), 0) AS hit_rate " +
                "FROM request_logs WHERE created_at >= NOW() - INTERVAL '7 days'",
            rs -> rs.next() ? (Number) rs.getObject("hit_rate") : 0
        );
        Number previousCacheHitRate = jdbcTemplate.query(
            "SELECT COALESCE(ROUND(AVG(CASE WHEN cache_hit THEN 100.0 ELSE 0.0 END), 1), 0) AS hit_rate " +
                "FROM request_logs WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'",
            rs -> rs.next() ? (Number) rs.getObject("hit_rate") : 0
        );
        double cacheTrend = currentCacheHitRate == null || previousCacheHitRate == null
            ? 0
            : currentCacheHitRate.doubleValue() - previousCacheHitRate.doubleValue();

        Number failedPayments = jdbcTemplate.query(
            "SELECT COUNT(*) AS total FROM billing_payments WHERE status NOT IN ('SUCCESS', 'CREATED')",
            rs -> rs.next() ? (Number) rs.getObject("total") : 0
        );

        result.put("usageGrowthPercent", roundOneDecimal(usageGrowth));
        result.put("cacheHitTrend", roundOneDecimal(cacheTrend));
        result.put("failedPayments", failedPayments == null ? 0 : failedPayments.intValue());
        result.put("topTenantsByRequests", topTenantsByRequests());
        result.put("topTenantsByErrors", topTenantsByErrors());
        result.put("topTenantsByRevenue", topTenantsByRevenue());
        result.put("topTenantsByCacheSavings", topTenantsByCacheSavings());
        result.put("notifications", buildNotifications());
        result.put("insights", buildInsights(currentWindow, previousWindow, failedPayments == null ? 0 : failedPayments.intValue(), cacheTrend));
        return result;
    }

    private List<Map<String, Object>> mapCostRows(List<Object[]> rows) {
        return rows.stream().map(row -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("timestamp", row[0] != null ? row[0].toString() : "");
            entry.put("cost", row[1] != null ? row[1] : 0);
            return entry;
        }).collect(Collectors.toList());
    }

    private Map<String, Object> buildSummary(long total, long cacheHits, Double avgLatency, BigDecimal totalCost, Long totalTokens, long errors, long liveRequests) {
        double cacheHitRate = total > 0 ? (cacheHits * 100.0 / total) : 0.0;
        BigDecimal safeCost = totalCost != null ? totalCost : BigDecimal.ZERO;
        BigDecimal avgLiveCost = liveRequests > 0
            ? safeCost.divide(BigDecimal.valueOf(liveRequests), 6, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal estimatedSavings = avgLiveCost.multiply(BigDecimal.valueOf(cacheHits));

        Map<String, Object> result = new HashMap<>();
        result.put("totalRequests", total);
        result.put("cacheHitRate", Math.round(cacheHitRate * 10.0) / 10.0);
        result.put("avgLatency", avgLatency != null ? Math.round(avgLatency) : 0);
        result.put("totalCost", safeCost);
        result.put("totalTokens", totalTokens != null ? totalTokens : 0);
        result.put("errorCount", errors);
        result.put("liveRequestCount", liveRequests);
        result.put("cacheSavingsUsd", estimatedSavings);
        return result;
    }

    private long countRequestsSinceDays(int fromDays, int toDays) {
        String sql = toDays == 0
            ? "SELECT COUNT(*) FROM request_logs WHERE created_at >= NOW() - (? || ' days')::interval"
            : "SELECT COUNT(*) FROM request_logs WHERE created_at >= NOW() - (? || ' days')::interval AND created_at < NOW() - (? || ' days')::interval";
        Number count = toDays == 0
            ? jdbcTemplate.query(sql, rs -> rs.next() ? (Number) rs.getObject(1) : 0, String.valueOf(fromDays))
            : jdbcTemplate.query(sql, rs -> rs.next() ? (Number) rs.getObject(1) : 0, String.valueOf(fromDays), String.valueOf(toDays));
        return count == null ? 0 : count.longValue();
    }

    private double growthPercent(long currentValue, long previousValue) {
        if (previousValue <= 0) {
            return currentValue > 0 ? 100.0 : 0.0;
        }
        return ((currentValue - previousValue) * 100.0) / previousValue;
    }

    private double roundOneDecimal(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private List<Map<String, Object>> topTenantsByRequests() {
        return jdbcTemplate.queryForList(
            "SELECT t.id, t.name, COUNT(r.id) AS metric " +
                "FROM tenants t LEFT JOIN request_logs r ON r.tenant_id = t.id " +
                "GROUP BY t.id, t.name ORDER BY metric DESC, t.name ASC LIMIT 5"
        );
    }

    private List<Map<String, Object>> topTenantsByErrors() {
        return jdbcTemplate.queryForList(
            "SELECT t.id, t.name, COUNT(r.id) AS metric " +
                "FROM tenants t LEFT JOIN request_logs r ON r.tenant_id = t.id " +
                "AND ((r.error_message IS NOT NULL AND r.error_message <> '') OR r.provider = 'FALLBACK') " +
                "GROUP BY t.id, t.name ORDER BY metric DESC, t.name ASC LIMIT 5"
        );
    }

    private List<Map<String, Object>> topTenantsByRevenue() {
        return jdbcTemplate.queryForList(
            "SELECT t.id, t.name, COALESCE(SUM(bp.amount_inr), 0) AS metric " +
                "FROM tenants t LEFT JOIN billing_payments bp ON bp.tenant_id = t.id AND bp.status = 'SUCCESS' " +
                "GROUP BY t.id, t.name ORDER BY metric DESC, t.name ASC LIMIT 5"
        );
    }

    private List<Map<String, Object>> topTenantsByCacheSavings() {
        return jdbcTemplate.queryForList(
            "SELECT t.id, t.name, COALESCE(" +
                "CASE WHEN SUM(CASE WHEN r.cache_hit = false AND (r.error_message IS NULL OR r.error_message = '') THEN 1 ELSE 0 END) = 0 THEN 0 " +
                "ELSE (COALESCE(SUM(r.cost_usd), 0) / NULLIF(SUM(CASE WHEN r.cache_hit = false AND (r.error_message IS NULL OR r.error_message = '') THEN 1 ELSE 0 END), 0)) " +
                "* SUM(CASE WHEN r.cache_hit = true THEN 1 ELSE 0 END) END, 0) AS metric " +
                "FROM tenants t LEFT JOIN request_logs r ON r.tenant_id = t.id " +
                "GROUP BY t.id, t.name ORDER BY metric DESC, t.name ASC LIMIT 5"
        );
    }

    private List<Map<String, Object>> buildNotifications() {
        List<Map<String, Object>> notifications = new java.util.ArrayList<>();

        List<Map<String, Object>> payments = jdbcTemplate.queryForList(
            "SELECT t.name, bp.plan_code, bp.amount_inr, COALESCE(bp.confirmed_at, bp.created_at) AS event_time " +
                "FROM billing_payments bp JOIN tenants t ON t.id = bp.tenant_id " +
                "WHERE bp.status = 'SUCCESS' ORDER BY COALESCE(bp.confirmed_at, bp.created_at) DESC LIMIT 3"
        );
        for (Map<String, Object> payment : payments) {
            notifications.add(notification(
                "payment",
                payment.get("name") + " upgraded to " + payment.get("plan_code"),
                "Successful payment of Rs " + payment.get("amount_inr"),
                payment.get("event_time"),
                "positive"
            ));
        }

        List<Map<String, Object>> expiringKeys = jdbcTemplate.queryForList(
            "SELECT t.name, ak.label, ak.expires_at FROM api_keys ak " +
                "JOIN tenants t ON t.id = ak.tenant_id " +
                "WHERE ak.active = true AND ak.expires_at IS NOT NULL AND ak.expires_at <= NOW() + INTERVAL '14 days' " +
                "ORDER BY ak.expires_at ASC LIMIT 3"
        );
        for (Map<String, Object> key : expiringKeys) {
            notifications.add(notification(
                "security",
                key.get("name") + " key expiring soon",
                String.valueOf(key.get("label")) + " expires on " + key.get("expires_at"),
                key.get("expires_at"),
                "warning"
            ));
        }

        List<Map<String, Object>> incidents = jdbcTemplate.queryForList(
            "SELECT t.name, COALESCE(NULLIF(r.error_message, ''), r.provider) AS issue, r.created_at " +
                "FROM request_logs r JOIN tenants t ON t.id = r.tenant_id " +
                "WHERE ((r.error_message IS NOT NULL AND r.error_message <> '') OR r.provider = 'FALLBACK') " +
                "ORDER BY r.created_at DESC LIMIT 3"
        );
        for (Map<String, Object> incident : incidents) {
            notifications.add(notification(
                "incident",
                incident.get("name") + " needs attention",
                String.valueOf(incident.get("issue")),
                incident.get("created_at"),
                "critical"
            ));
        }

        notifications.sort((left, right) -> String.valueOf(right.get("timestamp")).compareTo(String.valueOf(left.get("timestamp"))));
        return notifications.stream().limit(6).toList();
    }

    private List<String> buildInsights(long currentWindow, long previousWindow, int failedPayments, double cacheTrend) {
        List<String> insights = new java.util.ArrayList<>();
        if (currentWindow > previousWindow) {
            insights.add("Usage is up " + roundOneDecimal(growthPercent(currentWindow, previousWindow)) + "% over the previous week.");
        } else if (currentWindow < previousWindow) {
            insights.add("Usage slowed by " + Math.abs(roundOneDecimal(growthPercent(currentWindow, previousWindow))) + "% versus the previous week.");
        } else {
            insights.add("Usage is flat week over week, which is a good moment to drive activation.");
        }

        if (cacheTrend < 0) {
            insights.add("Cache hit rate dropped by " + Math.abs(roundOneDecimal(cacheTrend)) + " points. Review prompt reuse and cache thresholds.");
        } else if (cacheTrend > 0) {
            insights.add("Cache hit rate improved by " + roundOneDecimal(cacheTrend) + " points. Savings are trending in the right direction.");
        }

        if (failedPayments > 0) {
            insights.add(failedPayments + " payment event(s) need follow-up before they affect upgrades.");
        }

        if (insights.size() < 3) {
            insights.add("Enterprise plan positioning is strongest with tenants showing high request volume and low saved prompt capacity.");
        }
        return insights;
    }

    private Map<String, Object> notification(String type, String title, String detail, Object timestamp, String tone) {
        Map<String, Object> notification = new LinkedHashMap<>();
        notification.put("type", type);
        notification.put("title", title);
        notification.put("detail", detail);
        notification.put("timestamp", timestamp == null ? OffsetDateTime.now().toString() : timestamp.toString());
        notification.put("tone", tone);
        return notification;
    }
}
