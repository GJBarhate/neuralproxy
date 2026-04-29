package com.neuralproxy.model;

import java.math.BigDecimal;

public record PromptResponse(
    String text,
    String provider,
    long latencyMs,
    int tokenCount,
    BigDecimal costUsd,
    boolean cacheHit
) {}
