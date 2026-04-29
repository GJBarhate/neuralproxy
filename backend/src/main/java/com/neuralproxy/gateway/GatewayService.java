package com.neuralproxy.gateway;

import com.neuralproxy.analytics.AsyncLogService;
import com.neuralproxy.cache.RedisCacheService;
import com.neuralproxy.cache.SemanticCacheService;
import com.neuralproxy.model.PromptRequest;
import com.neuralproxy.model.PromptResponse;
import com.neuralproxy.ratelimit.RateLimitService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
public class GatewayService {

    private final SemanticCacheService semanticCache;
    private final RedisCacheService redisCache;
    private final GeminiRouter geminiRouter;
    private final RateLimitService rateLimitService;
    private final AsyncLogService asyncLogService;

    public GatewayService(SemanticCacheService semanticCache,
                          RedisCacheService redisCache,
                          GeminiRouter geminiRouter,
                          RateLimitService rateLimitService,
                          AsyncLogService asyncLogService) {
        this.semanticCache = semanticCache;
        this.redisCache = redisCache;
        this.geminiRouter = geminiRouter;
        this.rateLimitService = rateLimitService;
        this.asyncLogService = asyncLogService;
    }

    public PromptResponse process(PromptRequest req, UUID tenantId, String userKey) {
        if (req == null || req.prompt() == null || req.prompt().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prompt must not be blank");
        }

        String prompt = req.prompt().trim();
        boolean hasUserKey = (userKey != null && !userKey.isBlank());

        // 1. Rate limit
        if (!rateLimitService.canConsume(tenantId.toString())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
        }

        // 2. Cache check (skip if user provided their own key)
        if (!hasUserKey) {
            Optional<String> redisHit = redisCache.get(prompt, tenantId.toString());
            if (redisHit.isPresent() && isCacheableText(redisHit.get())) {
                PromptResponse cached = new PromptResponse(redisHit.get(), "CACHE", 0L, 0, BigDecimal.ZERO, true);
                asyncLogService.logAndPublish(cached, tenantId, prompt, false, "REDIS");
                return cached;
            }

            Optional<String> semanticHit = semanticCache.findSimilar(prompt, tenantId);
            if (semanticHit.isPresent() && isCacheableText(semanticHit.get())) {
                PromptResponse cached = new PromptResponse(semanticHit.get(), "CACHE", 0L, 0, BigDecimal.ZERO, true);
                asyncLogService.logAndPublish(cached, tenantId, prompt, false, "SEMANTIC");
                return cached;
            }
        }

        // 3. Call Gemini
        GeminiRouter.ProviderResponse pr;
        try {
            pr = geminiRouter.callGemini(prompt, hasUserKey ? userKey : null);
        } catch (Exception e) {
            throw new GatewayException("Failed to call Gemini: " + e.getMessage(), e);
        }

        // 4. Cache result (skip if user provided key)
        if (!hasUserKey && shouldCacheResponse(pr)) {
            redisCache.set(prompt, tenantId.toString(), pr.text(), Duration.ofHours(24));
            semanticCache.save(prompt, pr.text(), tenantId);
        }

        // 5. Build response
        PromptResponse response = new PromptResponse(
            pr.text(), pr.provider(), pr.latencyMs(), pr.tokenCount(), pr.costUsd(), false
        );

        // 6. Log async
        asyncLogService.logAndPublish(response, tenantId, prompt, hasUserKey, "NONE");

        return response;
    }

    private boolean shouldCacheResponse(GeminiRouter.ProviderResponse response) {
        return response != null
            && isCacheableText(response.text())
            && !"FALLBACK".equalsIgnoreCase(response.provider());
    }

    private boolean isCacheableText(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }

        String normalized = text.trim().toLowerCase();
        return !normalized.contains("service temporarily unavailable")
            && !normalized.contains("circuit breaker is open")
            && !normalized.contains("please try again in a few seconds");
    }
}
