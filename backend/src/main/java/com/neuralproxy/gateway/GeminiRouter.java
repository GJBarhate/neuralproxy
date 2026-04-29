package com.neuralproxy.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class GeminiRouter {

    private static final Logger log = LoggerFactory.getLogger(GeminiRouter.class);
    private static final long FAILED_BACKOFF_MS = 60_000L;
    private static final String GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String GENERATION_MODEL = "gemini-2.5-flash-lite";

    @Value("${gemini.api.keys}")
    private String rawKeys;

    private final ObjectMapper objectMapper;
    private List<String> systemKeys;
    private final AtomicInteger roundRobinIndex = new AtomicInteger(0);
    private final ConcurrentHashMap<String, Long> failedUntil = new ConcurrentHashMap<>();
    private final HttpClient httpClient;

    public GeminiRouter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    @PostConstruct
    public void init() {
        systemKeys = Arrays.stream(rawKeys.split(","))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toList());
        if (systemKeys.isEmpty()) {
            throw new IllegalStateException("No Gemini API keys configured");
        }
        log.info("GeminiRouter initialized with {} system key(s)", systemKeys.size());
    }

    public record ProviderResponse(String text, String provider, long latencyMs,
                                   int tokenCount, BigDecimal costUsd) {}

    public String getNextSystemKey() {
        long now = System.currentTimeMillis();
        for (int i = 0; i < systemKeys.size(); i++) {
            int idx = Math.abs(roundRobinIndex.getAndIncrement() % systemKeys.size());
            String key = systemKeys.get(idx);
            if (failedUntil.getOrDefault(key, 0L) <= now) {
                return key;
            }
        }
        throw new GatewayException("All Gemini API keys are currently unavailable");
    }

    public Map<String, Object> getProviderHealth() {
        long now = System.currentTimeMillis();
        long unavailable = systemKeys.stream()
            .filter(key -> failedUntil.getOrDefault(key, 0L) > now)
            .count();
        return Map.of(
            "provider", "Gemini",
            "model", GENERATION_MODEL,
            "configuredKeys", systemKeys.size(),
            "availableKeys", Math.max(0, systemKeys.size() - unavailable),
            "failedKeys", unavailable,
            "status", unavailable >= systemKeys.size() ? "down" : (unavailable > 0 ? "degraded" : "healthy")
        );
    }

    @CircuitBreaker(name = "gemini", fallbackMethod = "geminiCircuitFallback")
    public ProviderResponse callGemini(String prompt, String userKey) throws Exception {
        String apiKey;
        boolean isUserKey;

        if (userKey != null && !userKey.isBlank()) {
            apiKey = userKey.trim();
            isUserKey = true;
        } else {
            apiKey = getNextSystemKey();
            isUserKey = false;
        }

        long start = System.currentTimeMillis();

        try {
            return callGeminiWithKey(prompt, apiKey, isUserKey, start);
        } catch (GatewayException ge) {
            if (!isUserKey) {
                String nextKey = getNextSystemKey();
                return callGeminiWithKey(prompt, nextKey, false, start);
            }
            throw ge;
        }
    }

    private ProviderResponse callGeminiWithKey(String prompt, String apiKey, boolean isUserKey, long start) throws Exception {
        String requestBody = objectMapper.writeValueAsString(Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
            "generationConfig", Map.of("maxOutputTokens", 2048, "temperature", 0.7)
        ));

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(GEMINI_BASE + GENERATION_MODEL + ":generateContent"))
            .header("Content-Type", "application/json")
            .header("x-goog-api-key", apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(30))
            .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            if (!isUserKey) {
                failedUntil.put(apiKey, System.currentTimeMillis() + FAILED_BACKOFF_MS);
            }
            throw new GatewayException("Network error calling Gemini: " + e.getMessage(), e);
        }

        if (response.statusCode() >= 400) {
            if (!isUserKey) {
                failedUntil.put(apiKey, System.currentTimeMillis() + FAILED_BACKOFF_MS);
            }
            throw new GatewayException("Gemini API returned HTTP " + response.statusCode() + ": " + extractErrorMessage(response.body()));
        }

        return parseGeminiResponse(response.body(), isUserKey ? "USER" : "SYSTEM", start);
    }

    public ProviderResponse geminiCircuitFallback(String prompt, String userKey, Throwable t) {
        log.warn("Circuit breaker open for Gemini: {}", t.getMessage());
        return new ProviderResponse(
            "Service temporarily unavailable. The circuit breaker is open. Please try again in a few seconds.",
            "FALLBACK", 0L, 0, BigDecimal.ZERO
        );
    }

    private ProviderResponse parseGeminiResponse(String body, String provider, long start) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        String text = root.at("/candidates/0/content/parts/0/text").asText("(empty response)");
        int tokens = root.at("/usageMetadata/totalTokenCount").asInt(100);
        BigDecimal cost = BigDecimal.valueOf(tokens).multiply(new BigDecimal("0.000001"));
        long latency = System.currentTimeMillis() - start;
        return new ProviderResponse(text, provider, latency, tokens, cost);
    }

    private String extractErrorMessage(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String message = root.at("/error/message").asText("");
            return message.isBlank() ? "Unknown error" : message;
        } catch (Exception ignored) {
            return "Unknown error";
        }
    }

    public String validateKey(String key) throws Exception {
        String cleanedKey = key == null ? "" : key.trim();
        if (cleanedKey.isBlank()) {
            throw new InvalidApiKeyException("Gemini API key is required");
        }

        String body = objectMapper.writeValueAsString(Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", "Reply with OK")))),
            "generationConfig", Map.of("maxOutputTokens", 8, "temperature", 0)
        ));

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(GEMINI_BASE + GENERATION_MODEL + ":generateContent"))
            .header("Content-Type", "application/json")
            .header("x-goog-api-key", cleanedKey)
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .timeout(Duration.ofSeconds(10))
            .build();

        try {
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                return "VALID";
            }

            String message = extractErrorMessage(resp.body());
            if (resp.statusCode() == 400 || resp.statusCode() == 401 || resp.statusCode() == 403) {
                throw new InvalidApiKeyException(message.isBlank() ? "Invalid Gemini API key. Please check and try again." : message);
            }
            throw new InvalidApiKeyException("Could not validate key right now: " + (message.isBlank() ? ("HTTP " + resp.statusCode()) : message));
        } catch (IOException | InterruptedException e) {
            throw new InvalidApiKeyException("Could not validate key: " + e.getMessage());
        }
    }
}
