package com.neuralproxy.analytics;

import com.neuralproxy.model.PromptResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class AsyncLogService {

    private static final Logger log = LoggerFactory.getLogger(AsyncLogService.class);

    private final RequestLogRepository repo;
    private final AnalyticsService analyticsService;
    private final WebSocketPublisher publisher;

    public AsyncLogService(RequestLogRepository repo,
                           AnalyticsService analyticsService,
                           WebSocketPublisher publisher) {
        this.repo = repo;
        this.analyticsService = analyticsService;
        this.publisher = publisher;
    }

    @Async
    public void logAndPublish(PromptResponse response, UUID tenantId, String prompt, boolean usedUserKey) {
        logAndPublish(response, tenantId, prompt, usedUserKey, "NONE");
    }

    @Async
    public void logAndPublish(PromptResponse response, UUID tenantId, String prompt, boolean usedUserKey, String cacheSource) {
        try {
            RequestLog logEntry = new RequestLog();
            logEntry.setId(UUID.randomUUID());
            logEntry.setTenantId(tenantId);
            logEntry.setPrompt(prompt.length() > 500 ? prompt.substring(0, 500) : prompt);
            logEntry.setProvider(response.provider());
            logEntry.setLatencyMs(response.latencyMs());
            logEntry.setTokenCount(response.tokenCount());
            logEntry.setCostUsd(response.costUsd());
            logEntry.setCacheHit(response.cacheHit());
            logEntry.setKeySource(usedUserKey ? "USER" : "SYSTEM");
            logEntry.setResponseText(response.text() == null ? null : response.text().substring(0, Math.min(response.text().length(), 4000)));
            logEntry.setCacheSource(cacheSource);

            repo.save(logEntry);

            Map<String, Object> summary = analyticsService.getSummary();
            publisher.publishAnalytics(summary);
        } catch (Exception e) {
            log.error("AsyncLogService error: {}", e.getMessage(), e);
        }
    }

    @Async
    public void logFailure(UUID tenantId, String prompt, boolean usedUserKey, String errorMessage) {
        try {
            RequestLog logEntry = new RequestLog();
            logEntry.setId(UUID.randomUUID());
            logEntry.setTenantId(tenantId);
            logEntry.setPrompt(prompt == null ? null : prompt.substring(0, Math.min(prompt.length(), 500)));
            logEntry.setProvider("ERROR");
            logEntry.setLatencyMs(0L);
            logEntry.setTokenCount(0);
            logEntry.setCostUsd(java.math.BigDecimal.ZERO);
            logEntry.setCacheHit(false);
            logEntry.setKeySource(usedUserKey ? "USER" : "SYSTEM");
            logEntry.setErrorMessage(errorMessage == null ? "Unknown error" : errorMessage.substring(0, Math.min(errorMessage.length(), 1000)));
            logEntry.setCacheSource("NONE");
            repo.save(logEntry);
        } catch (Exception e) {
            log.error("AsyncLogService failure-log error: {}", e.getMessage(), e);
        }
    }
}
