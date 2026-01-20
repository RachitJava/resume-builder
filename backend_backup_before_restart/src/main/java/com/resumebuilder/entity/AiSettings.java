package com.resumebuilder.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_settings")
@Data
public class AiSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Master switch for external AI providers.
     * Default: FALSE (use built-in intelligence only)
     */
    @Column(name = "enable_external_ai", nullable = false)
    private Boolean enableExternalAi = false;

    /**
     * Preferred AI provider when external AI is enabled
     */
    @Column(name = "preferred_provider")
    private String preferredProvider = "groq";

    /**
     * Enable adaptive difficulty
     */
    @Column(name = "enable_adaptive_difficulty")
    private Boolean enableAdaptiveDifficulty = true;

    /**
     * Enable AI-enhanced feedback (costs tokens)
     */
    @Column(name = "enable_ai_enhanced_feedback")
    private Boolean enableAiEnhancedFeedback = false;

    /**
     * Cost control settings
     */
    @Column(name = "max_tokens_per_request")
    private Integer maxTokensPerRequest = 1000;

    @Column(name = "daily_token_budget")
    private Integer dailyTokenBudget = 100000;

    @Column(name = "monthly_token_budget")
    private Integer monthlyTokenBudget = 3000000;

    /**
     * Intelligence API configuration
     */
    @Column(name = "intelligence_api_url")
    private String intelligenceApiUrl = "http://localhost:8000";

    /**
     * Token usage tracking
     */
    @Column(name = "tokens_used_today")
    private Integer tokensUsedToday = 0;

    @Column(name = "tokens_used_this_month")
    private Integer tokensUsedThisMonth = 0;

    @Column(name = "last_reset_date")
    private LocalDateTime lastResetDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        lastResetDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Check if we can use external AI based on budget
     */
    public boolean canUseExternalAi() {
        if (!enableExternalAi) {
            return false;
        }

        // Check daily budget
        if (tokensUsedToday >= dailyTokenBudget) {
            return false;
        }

        // Check monthly budget
        if (tokensUsedThisMonth >= monthlyTokenBudget) {
            return false;
        }

        return true;
    }

    /**
     * Record token usage
     */
    public void recordTokenUsage(int tokens) {
        this.tokensUsedToday += tokens;
        this.tokensUsedThisMonth += tokens;
    }

    /**
     * Reset daily usage
     */
    public void resetDailyUsage() {
        this.tokensUsedToday = 0;
    }

    /**
     * Reset monthly usage
     */
    public void resetMonthlyUsage() {
        this.tokensUsedThisMonth = 0;
    }
}
