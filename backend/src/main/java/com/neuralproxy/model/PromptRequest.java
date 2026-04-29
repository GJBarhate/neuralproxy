package com.neuralproxy.model;

import jakarta.validation.constraints.NotBlank;

public record PromptRequest(@NotBlank String prompt, String model) {}
