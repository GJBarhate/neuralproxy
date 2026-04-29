package com.neuralproxy.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuralproxy.common.TenantAccess;
import com.neuralproxy.ratelimit.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BillingService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final JdbcTemplate jdbcTemplate;
    private final RateLimitService rateLimitService;

    @Value("${billing.razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${billing.razorpay.key-secret:}")
    private String razorpayKeySecret;

    public BillingService(ObjectMapper objectMapper, JdbcTemplate jdbcTemplate, RateLimitService rateLimitService) {
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.rateLimitService = rateLimitService;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public Map<String, Object> getBillingConfig(Authentication auth, HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("enabled", isConfigured());
        data.put("provider", "Razorpay");
        data.put("keyId", razorpayKeyId == null || razorpayKeyId.isBlank() ? null : razorpayKeyId);
        data.put("plans", BillingPlans.all());
        data.put("currentSubscription", getCurrentSubscription(tenantId));
        return data;
    }

    public Map<String, Object> createOrder(String planCode, Integer amount, Authentication auth, HttpServletRequest request) {
        if (!isConfigured()) {
            throw new IllegalStateException("Razorpay is not configured yet. Add billing.razorpay.key-id and billing.razorpay.key-secret first.");
        }

        try {
            UUID tenantId = TenantAccess.extractTenantId(auth, request);
            String normalizedPlan = BillingPlans.normalize(planCode);
            if ("FREE".equals(normalizedPlan)) {
                throw new IllegalStateException("Free plan does not require payment.");
            }
            int orderAmount = amount == null || amount <= 0 ? BillingPlans.amountFor(normalizedPlan) : amount;
            String payload = objectMapper.writeValueAsString(Map.of(
                "amount", orderAmount * 100,
                "currency", "INR",
                "receipt", "np_" + System.currentTimeMillis(),
                "notes", Map.of("planCode", normalizedPlan, "tenantId", tenantId.toString())
            ));
            HttpRequest razorpayRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.razorpay.com/v1/orders"))
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString((razorpayKeyId + ":" + razorpayKeySecret).getBytes(StandardCharsets.UTF_8)))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .timeout(Duration.ofSeconds(20))
                .build();

            HttpResponse<String> response = httpClient.send(razorpayRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalStateException("Razorpay order creation failed: " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            String orderId = root.path("id").asText();
            jdbcTemplate.update(
                "INSERT INTO billing_payments(id, tenant_id, plan_code, amount_inr, razorpay_order_id, status, notes) " +
                    "VALUES(gen_random_uuid(), ?::uuid, ?, ?, ?, 'CREATED', ?)",
                tenantId.toString(), normalizedPlan, orderAmount, orderId, "Checkout created"
            );
            return Map.of(
                "id", orderId,
                "amount", root.path("amount").asInt(),
                "currency", root.path("currency").asText("INR"),
                "keyId", razorpayKeyId,
                "planCode", normalizedPlan
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create Razorpay order: " + ex.getMessage());
        }
    }

    public Map<String, Object> confirmPayment(String orderId,
                                              String paymentId,
                                              String signature,
                                              Authentication auth,
                                              HttpServletRequest request) {
        UUID tenantId = TenantAccess.extractTenantId(auth, request);
        if (!isConfigured()) {
            throw new IllegalStateException("Razorpay is not configured yet.");
        }
        if (orderId == null || paymentId == null || signature == null) {
            throw new IllegalStateException("Missing payment confirmation fields.");
        }

        verifySignature(orderId, paymentId, signature);

        Map<String, Object> payment = jdbcTemplate.query(
            "SELECT plan_code, amount_inr, status FROM billing_payments WHERE razorpay_order_id = ? AND tenant_id = ?::uuid",
            rs -> rs.next()
                ? Map.of(
                    "planCode", rs.getString("plan_code"),
                    "amountInr", rs.getInt("amount_inr"),
                    "status", rs.getString("status")
                )
                : null,
            orderId, tenantId.toString()
        );

        if (payment == null) {
            throw new IllegalStateException("Billing order not found for this tenant.");
        }
        if ("SUCCESS".equals(payment.get("status"))) {
            return Map.of("success", true, "message", "Payment already confirmed.", "subscription", getCurrentSubscription(tenantId));
        }

        String planCode = String.valueOf(payment.get("planCode"));
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime billingEnd = now.plusDays(30);

        jdbcTemplate.update(
            "UPDATE billing_payments SET razorpay_payment_id = ?, status = 'SUCCESS', confirmed_at = NOW(), notes = ? WHERE razorpay_order_id = ?",
            paymentId, "Confirmed via checkout handler", orderId
        );
        jdbcTemplate.update(
            "UPDATE tenants SET plan = ?, subscription_status = 'ACTIVE', plan_started_at = ?, billing_cycle_end = ? WHERE id = ?::uuid",
            planCode, now, billingEnd, tenantId.toString()
        );
        rateLimitService.resetBucket(tenantId.toString());

        return Map.of(
            "success", true,
            "message", "Plan upgraded successfully.",
            "subscription", getCurrentSubscription(tenantId)
        );
    }

    public Map<String, Object> getAdminSummary() {
        Number totalRevenue = jdbcTemplate.query(
            "SELECT COALESCE(SUM(amount_inr), 0) AS total FROM billing_payments WHERE status = 'SUCCESS'",
            rs -> rs.next() ? (Number) rs.getObject("total") : 0
        );
        Number monthlyRevenue = jdbcTemplate.query(
            "SELECT COALESCE(SUM(amount_inr), 0) AS total FROM billing_payments WHERE status = 'SUCCESS' AND confirmed_at >= date_trunc('month', NOW())",
            rs -> rs.next() ? (Number) rs.getObject("total") : 0
        );
        Number totalSubs = jdbcTemplate.query(
            "SELECT COUNT(*) AS total FROM tenants WHERE plan <> 'FREE' AND active = true",
            rs -> rs.next() ? (Number) rs.getObject("total") : 0
        );
        List<Map<String, Object>> planBreakdown = jdbcTemplate.queryForList(
            "SELECT plan, COUNT(*) AS count FROM tenants GROUP BY plan ORDER BY plan"
        );
        List<Map<String, Object>> recentPayments = jdbcTemplate.queryForList(
            "SELECT t.name AS tenant_name, bp.plan_code, bp.amount_inr, bp.status, bp.confirmed_at, bp.created_at " +
                "FROM billing_payments bp JOIN tenants t ON t.id = bp.tenant_id " +
                "ORDER BY COALESCE(bp.confirmed_at, bp.created_at) DESC LIMIT 8"
        );

        return Map.of(
            "totalRevenueInr", totalRevenue,
            "monthlyRevenueInr", monthlyRevenue,
            "activePaidSubscriptions", totalSubs,
            "planBreakdown", planBreakdown,
            "recentPayments", recentPayments
        );
    }

    public Map<String, Object> getCurrentSubscription(UUID tenantId) {
        Map<String, Object> tenant = jdbcTemplate.query(
            "SELECT plan, subscription_status, plan_started_at, billing_cycle_end FROM tenants WHERE id = ?::uuid",
            rs -> {
                if (!rs.next()) {
                    return defaultSubscriptionRow();
                }
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("plan", rs.getString("plan"));
                row.put("subscriptionStatus", rs.getString("subscription_status") == null ? "FREE" : rs.getString("subscription_status"));
                row.put("planStartedAt", rs.getTimestamp("plan_started_at") == null ? null : rs.getTimestamp("plan_started_at").toInstant().toString());
                row.put("billingCycleEnd", rs.getTimestamp("billing_cycle_end") == null ? null : rs.getTimestamp("billing_cycle_end").toInstant().toString());
                return row;
            },
            tenantId.toString()
        );

        String planCode = String.valueOf(tenant.get("plan"));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("planCode", planCode);
        result.put("subscriptionStatus", tenant.get("subscriptionStatus"));
        result.put("planStartedAt", tenant.get("planStartedAt"));
        result.put("billingCycleEnd", tenant.get("billingCycleEnd"));
        result.put("limits", BillingPlans.get(planCode));
        return result;
    }

    private boolean isConfigured() {
        return razorpayKeyId != null && !razorpayKeyId.isBlank() && razorpayKeySecret != null && !razorpayKeySecret.isBlank();
    }

    private void verifySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
            if (!expected.equals(signature)) {
                throw new IllegalStateException("Payment signature verification failed.");
            }
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Could not verify Razorpay signature: " + ex.getMessage());
        }
    }

    private Map<String, Object> defaultSubscriptionRow() {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("plan", "FREE");
        row.put("subscriptionStatus", "FREE");
        row.put("planStartedAt", null);
        row.put("billingCycleEnd", null);
        return row;
    }
}
