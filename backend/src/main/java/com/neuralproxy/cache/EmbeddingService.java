package com.neuralproxy.cache;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuralproxy.gateway.GeminiRouter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);
    private static final String EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=";

    private final GeminiRouter geminiRouter;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public EmbeddingService(GeminiRouter geminiRouter, ObjectMapper objectMapper) {
        this.geminiRouter = geminiRouter;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public float[] embed(String text) {
        try {
            String apiKey = geminiRouter.getNextSystemKey();
            String body = objectMapper.writeValueAsString(Map.of(
                "model", "models/text-embedding-004",
                "content", Map.of("parts", List.of(Map.of("text", text)))
            ));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(EMBED_URL + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(15))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Embedding API returned {}, using zero vector", response.statusCode());
                return new float[768];
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode values = root.at("/embedding/values");

            if (values.isMissingNode() || !values.isArray()) {
                log.warn("Embedding response missing values, using zero vector");
                return new float[768];
            }

            float[] embedding = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                embedding[i] = (float) values.get(i).asDouble();
            }
            return embedding;

        } catch (Exception e) {
            log.warn("Embedding failed, returning zero vector: {}", e.getMessage());
            return new float[768];
        }
    }

    public boolean isZeroVector(float[] embedding) {
        if (embedding == null || embedding.length == 0) {
            return true;
        }

        for (float value : embedding) {
            if (value != 0.0f) {
                return false;
            }
        }

        return true;
    }
}
