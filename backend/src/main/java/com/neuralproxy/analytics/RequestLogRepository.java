package com.neuralproxy.analytics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RequestLogRepository extends JpaRepository<RequestLog, UUID> {

    @Query("SELECT COUNT(r) FROM RequestLog r")
    long countAll();

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE r.tenantId = :tenantId")
    long countAllByTenant(UUID tenantId);

    @Query("SELECT AVG(r.latencyMs) FROM RequestLog r WHERE r.cacheHit = false")
    Double avgLatency();

    @Query("SELECT AVG(r.latencyMs) FROM RequestLog r WHERE r.cacheHit = false AND r.tenantId = :tenantId")
    Double avgLatencyByTenant(UUID tenantId);

    @Query("SELECT SUM(r.costUsd) FROM RequestLog r")
    BigDecimal totalCost();

    @Query("SELECT SUM(r.costUsd) FROM RequestLog r WHERE r.tenantId = :tenantId")
    BigDecimal totalCostByTenant(UUID tenantId);

    @Query("SELECT COALESCE(SUM(r.tokenCount), 0) FROM RequestLog r")
    Long totalTokens();

    @Query("SELECT COALESCE(SUM(r.tokenCount), 0) FROM RequestLog r WHERE r.tenantId = :tenantId")
    Long totalTokensByTenant(UUID tenantId);

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE r.cacheHit = true")
    long countCacheHits();

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE r.cacheHit = true AND r.tenantId = :tenantId")
    long countCacheHitsByTenant(UUID tenantId);

    List<RequestLog> findByOrderByCreatedAtDesc(Pageable pageable);

    List<RequestLog> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    @Query(value = "SELECT DATE_TRUNC('hour', created_at) AS hour, " +
        "SUM(cost_usd) AS cost FROM request_logs " +
        "WHERE created_at >= NOW() - INTERVAL '24 hours' " +
        "GROUP BY hour ORDER BY hour", nativeQuery = true)
    List<Object[]> getCostOverTime();

    @Query(value = "SELECT DATE_TRUNC('hour', created_at) AS hour, " +
        "SUM(cost_usd) AS cost FROM request_logs " +
        "WHERE tenant_id = :tenantId AND created_at >= NOW() - INTERVAL '24 hours' " +
        "GROUP BY hour ORDER BY hour", nativeQuery = true)
    List<Object[]> getCostOverTimeByTenant(UUID tenantId);

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE r.keySource = 'USER'")
    long countUserKeyRequests();

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE r.keySource = 'SYSTEM'")
    long countSystemKeyRequests();

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE r.keySource = 'USER' AND r.tenantId = :tenantId")
    long countUserKeyRequestsByTenant(UUID tenantId);

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE r.keySource = 'SYSTEM' AND r.tenantId = :tenantId")
    long countSystemKeyRequestsByTenant(UUID tenantId);

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE (r.errorMessage IS NOT NULL AND r.errorMessage <> '') OR r.provider = 'FALLBACK'")
    long countErrors();

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE ((r.errorMessage IS NOT NULL AND r.errorMessage <> '') OR r.provider = 'FALLBACK') AND r.tenantId = :tenantId")
    long countErrorsByTenant(UUID tenantId);

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE r.cacheHit = false AND (r.errorMessage IS NULL OR r.errorMessage = '')")
    long countLiveRequests();

    @Query("SELECT COUNT(r) FROM RequestLog r WHERE r.cacheHit = false AND (r.errorMessage IS NULL OR r.errorMessage = '') AND r.tenantId = :tenantId")
    long countLiveRequestsByTenant(UUID tenantId);

    Optional<RequestLog> findByIdAndTenantId(UUID id, UUID tenantId);
}
