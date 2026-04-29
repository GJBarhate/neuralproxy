package com.neuralproxy.analytics;

import java.util.LinkedHashMap;
import java.util.Map;

public final class RequestLogMapper {

    private RequestLogMapper() {
    }

    public static Map<String, Object> toMap(RequestLog log) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", log.getId());
        data.put("tenantId", log.getTenantId());
        data.put("prompt", log.getPrompt());
        data.put("provider", log.getProvider());
        data.put("latencyMs", log.getLatencyMs());
        data.put("tokenCount", log.getTokenCount());
        data.put("costUsd", log.getCostUsd());
        data.put("cacheHit", log.getCacheHit());
        data.put("keySource", log.getKeySource());
        data.put("responseText", log.getResponseText());
        data.put("errorMessage", log.getErrorMessage());
        data.put("cacheSource", log.getCacheSource());
        data.put("createdAt", log.getCreatedAt());
        return data;
    }
}
