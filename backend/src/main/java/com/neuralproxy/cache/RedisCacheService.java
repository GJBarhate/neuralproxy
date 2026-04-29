package com.neuralproxy.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Set;
import java.util.Optional;

@Service
public class RedisCacheService {

    private static final Logger log = LoggerFactory.getLogger(RedisCacheService.class);

    private final StringRedisTemplate redisTemplate;

    public RedisCacheService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private String cacheKey(String prompt, String tenantId) {
        String hash = DigestUtils.md5DigestAsHex(prompt.getBytes(StandardCharsets.UTF_8));
        return "np:cache:" + hash + ":" + tenantId;
    }

    public Optional<String> get(String prompt, String tenantId) {
        try {
            return Optional.ofNullable(redisTemplate.opsForValue().get(cacheKey(prompt, tenantId)));
        } catch (Exception e) {
            log.warn("Redis get failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public void set(String prompt, String tenantId, String value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(cacheKey(prompt, tenantId), value, ttl);
        } catch (Exception e) {
            log.warn("Redis set failed: {}", e.getMessage());
        }
    }

    public void clearProjectCache() {
        try {
            Set<String> keys = redisTemplate.keys("np:cache:*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Redis cache clear failed: {}", e.getMessage());
        }
    }
}
