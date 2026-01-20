package com.resumebuilder.dto;

import lombok.Data;

@Data
public class AiSettingsDTO {
    /**
     * Master switch for external AI providers.
     * If disabled, only built-in intelligence is used (FREE, no API costs)
     */
    private Boolean enableExternalAi = false;

    /**
     * Which external AI provider to use when enabled
     * Options: groq, ollama, openai, anthropic
     */
    private String preferredProvider = "groq";

    /**
     * Enable/disable adaptive difficulty in interviews
     */
    private Boolean enableAdaptiveDifficulty = true;

    /**
     * Enable/disable AI-enhanced feedback
     * (Uses external AI to enhance evaluation feedback)
     */
    private Boolean enableAiEnhancedFeedback = false;

    /**
     * Maximum tokens per AI request (cost control)
     */
    private Integer maxTokensPerRequest = 1000;

    /**
     * Daily token budget limit
     */
    private Integer dailyTokenBudget = 100000;

    /**
     * Monthly token budget limit
     */
    private Integer monthlyTokenBudget = 3000000;

    /**
     * Intelligence API base URL
     */
    private String intelligenceApiUrl = "http://localhost:8000";
}
