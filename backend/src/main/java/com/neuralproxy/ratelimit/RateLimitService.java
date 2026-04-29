package com.neuralproxy.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import com.neuralproxy.billing.BillingPlans;

@Service
public class RateLimitService {

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final JdbcTemplate jdbcTemplate;

    public RateLimitService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private Bucket createBucket(String tenantId) {
        String plan = jdbcTemplate.query(
            "SELECT plan FROM tenants WHERE id = ?::uuid",
            rs -> rs.next() ? rs.getString("plan") : "FREE",
            tenantId
        );
        int capacity = BillingPlans.rpmFor(plan);
        Bandwidth limit = Bandwidth.builder()
            .capacity(capacity)
            .refillGreedy(capacity, Duration.ofMinutes(1))
            .build();
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }

    public boolean canConsume(String tenantId) {
        return buckets.computeIfAbsent(tenantId, this::createBucket).tryConsume(1);
    }

    public void resetBucket(String tenantId) {
        if (tenantId != null) {
          buckets.remove(tenantId);
        }
    }
}
