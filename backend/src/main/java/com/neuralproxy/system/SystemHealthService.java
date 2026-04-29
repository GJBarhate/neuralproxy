package com.neuralproxy.system;

import com.neuralproxy.gateway.GeminiRouter;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SystemHealthService {

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;
    private final GeminiRouter geminiRouter;

    public SystemHealthService(JdbcTemplate jdbcTemplate,
                               StringRedisTemplate redisTemplate,
                               GeminiRouter geminiRouter) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisTemplate = redisTemplate;
        this.geminiRouter = geminiRouter;
    }

    public Map<String, Object> getSnapshot() {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("database", probeDatabase());
        snapshot.put("redis", probeRedis());
        snapshot.put("websocket", Map.of("status", "healthy", "transport", "SockJS/STOMP"));
        snapshot.put("provider", geminiRouter.getProviderHealth());
        snapshot.put("checkedAt", Instant.now().toString());
        return snapshot;
    }

    private Map<String, Object> probeDatabase() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return Map.of("status", result != null && result == 1 ? "healthy" : "degraded");
        } catch (DataAccessException ex) {
            return Map.of("status", "down", "message", ex.getMostSpecificCause().getMessage());
        }
    }

    private Map<String, Object> probeRedis() {
        try {
            String pong = redisTemplate.getConnectionFactory().getConnection().ping();
            return Map.of("status", "PONG".equalsIgnoreCase(pong) ? "healthy" : "degraded", "message", pong);
        } catch (Exception ex) {
            return Map.of("status", "down", "message", ex.getMessage());
        }
    }
}
