package com.neuralproxy.cache;

import com.pgvector.PGvector;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SemanticCacheService {

    private static final Logger log = LoggerFactory.getLogger(SemanticCacheService.class);

    private final JdbcTemplate jdbcTemplate;
    private final EmbeddingService embeddingService;

    public SemanticCacheService(JdbcTemplate jdbcTemplate, EmbeddingService embeddingService) {
        this.jdbcTemplate = jdbcTemplate;
        this.embeddingService = embeddingService;
    }

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute((java.sql.Connection conn) -> {
                PGvector.addVectorType(conn);
                return null;
            });
            log.info("PGvector type registered successfully");
        } catch (Exception e) {
            log.warn("Could not register PGvector type: {}", e.getMessage());
        }
    }

    public void save(String promptText, String responseText, UUID tenantId) {
        try {
            float[] embedding = embeddingService.embed(promptText);
            if (embeddingService.isZeroVector(embedding)) {
                log.info("Skipping semantic cache save because embedding is unavailable");
                return;
            }

            String promptHash = DigestUtils.md5DigestAsHex(promptText.getBytes(StandardCharsets.UTF_8));
            String vectorValue = new PGvector(embedding).getValue();

            jdbcTemplate.update(
                "INSERT INTO prompt_cache (prompt_hash, prompt_text, response, embedding, tenant_id) " +
                "VALUES (?, ?, ?, ?::vector, ?::uuid) " +
                "ON CONFLICT DO NOTHING",
                promptHash, promptText, responseText, vectorValue, tenantId.toString()
            );
        } catch (Exception e) {
            log.warn("SemanticCache save failed: {}", e.getMessage());
        }
    }

    public Optional<String> findSimilar(String promptText, UUID tenantId) {
        try {
            float[] embedding = embeddingService.embed(promptText);
            if (embeddingService.isZeroVector(embedding)) {
                log.info("Skipping semantic cache lookup because embedding is unavailable");
                return Optional.empty();
            }

            String vectorValue = new PGvector(embedding).getValue();

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT response, (embedding <-> ?::vector) AS dist FROM prompt_cache " +
                "WHERE tenant_id = ?::uuid AND embedding IS NOT NULL " +
                "ORDER BY embedding <-> ?::vector LIMIT 1",
                vectorValue, tenantId.toString(), vectorValue
            );

            if (!rows.isEmpty()) {
                double dist = ((Number) rows.get(0).get("dist")).doubleValue();
                if (dist < 0.08) {
                    return Optional.of((String) rows.get(0).get("response"));
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            log.warn("SemanticCache lookup failed: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
