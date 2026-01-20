package com.resumebuilder.service;

import com.resumebuilder.dto.AiSettingsDTO;
import com.resumebuilder.entity.AiSettings;
import com.resumebuilder.repository.AiSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiSettingsService {

    private final AiSettingsRepository settingsRepository;

    /**
     * Get current AI settings. Creates default settings if none exist.
     */
    public AiSettings getCurrentSettings() {
        return settingsRepository.getCurrentSettings()
                .orElseGet(this::createDefaultSettings);
    }

    /**
     * Create default AI settings (external AI disabled)
     */
    @Transactional
    public AiSettings createDefaultSettings() {
        log.info("Creating default AI settings - External AI DISABLED by default");

        AiSettings settings = new AiSettings();
        settings.setEnableExternalAi(false); // Disabled by default to save costs
        settings.setPreferredProvider("groq");
        settings.setEnableAdaptiveDifficulty(true);
        settings.setEnableAiEnhancedFeedback(false);
        settings.setMaxTokensPerRequest(1000);
        settings.setDailyTokenBudget(100000);
        settings.setMonthlyTokenBudget(3000000);
        settings.setIntelligenceApiUrl("http://localhost:8000");
        settings.setTokensUsedToday(0);
        settings.setTokensUsedThisMonth(0);

        return settingsRepository.save(settings);
    }

    /**
     * Update AI settings (admin only)
     */
    @Transactional
    public AiSettings updateSettings(AiSettingsDTO dto) {
        AiSettings settings = getCurrentSettings();

        if (dto.getEnableExternalAi() != null) {
            log.info("External AI setting changed to: {}", dto.getEnableExternalAi());
            settings.setEnableExternalAi(dto.getEnableExternalAi());
        }

        if (dto.getPreferredProvider() != null) {
            settings.setPreferredProvider(dto.getPreferredProvider());
        }

        if (dto.getEnableAdaptiveDifficulty() != null) {
            settings.setEnableAdaptiveDifficulty(dto.getEnableAdaptiveDifficulty());
        }

        if (dto.getEnableAiEnhancedFeedback() != null) {
            settings.setEnableAiEnhancedFeedback(dto.getEnableAiEnhancedFeedback());
        }

        if (dto.getMaxTokensPerRequest() != null) {
            settings.setMaxTokensPerRequest(dto.getMaxTokensPerRequest());
        }

        if (dto.getDailyTokenBudget() != null) {
            settings.setDailyTokenBudget(dto.getDailyTokenBudget());
        }

        if (dto.getMonthlyTokenBudget() != null) {
            settings.setMonthlyTokenBudget(dto.getMonthlyTokenBudget());
        }

        if (dto.getIntelligenceApiUrl() != null) {
            settings.setIntelligenceApiUrl(dto.getIntelligenceApiUrl());
        }

        return settingsRepository.save(settings);
    }

    /**
     * Check if external AI can be used based on budget and settings
     */
    public boolean canUseExternalAi() {
        AiSettings settings = getCurrentSettings();

        // Check if we need to reset counters
        checkAndResetUsage(settings);

        return settings.canUseExternalAi();
    }

    /**
     * Record token usage for billing tracking
     */
    @Transactional
    public void recordTokenUsage(int tokens) {
        AiSettings settings = getCurrentSettings();

        checkAndResetUsage(settings);

        settings.recordTokenUsage(tokens);
        settingsRepository.save(settings);

        log.info("Recorded {} tokens. Today: {}/{}, Month: {}/{}",
                tokens,
                settings.getTokensUsedToday(), settings.getDailyTokenBudget(),
                settings.getTokensUsedThisMonth(), settings.getMonthlyTokenBudget());
    }

    /**
     * Check and reset usage counters if needed
     */
    private void checkAndResetUsage(AiSettings settings) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastReset = settings.getLastResetDate();

        // Reset daily usage if it's a new day
        if (lastReset != null && ChronoUnit.DAYS.between(lastReset, now) >= 1) {
            log.info("Resetting daily token usage");
            settings.resetDailyUsage();
        }

        // Reset monthly usage if it's a new month
        if (lastReset != null && ChronoUnit.MONTHS.between(lastReset, now) >= 1) {
            log.info("Resetting monthly token usage");
            settings.resetMonthlyUsage();
        }

        if (lastReset == null || ChronoUnit.DAYS.between(lastReset, now) >= 1) {
            settings.setLastResetDate(now);
            settingsRepository.save(settings);
        }
    }

    /**
     * Get usage statistics
     */
    public AiSettingsDTO getUsageStats() {
        AiSettings settings = getCurrentSettings();
        checkAndResetUsage(settings);

        AiSettingsDTO dto = new AiSettingsDTO();
        dto.setEnableExternalAi(settings.getEnableExternalAi());
        dto.setPreferredProvider(settings.getPreferredProvider());
        dto.setEnableAdaptiveDifficulty(settings.getEnableAdaptiveDifficulty());
        dto.setEnableAiEnhancedFeedback(settings.getEnableAiEnhancedFeedback());
        dto.setMaxTokensPerRequest(settings.getMaxTokensPerRequest());
        dto.setDailyTokenBudget(settings.getDailyTokenBudget());
        dto.setMonthlyTokenBudget(settings.getMonthlyTokenBudget());
        dto.setIntelligenceApiUrl(settings.getIntelligenceApiUrl());

        return dto;
    }

    /**
     * Toggle external AI on/off (quick switch for admin)
     */
    @Transactional
    public AiSettings toggleExternalAi() {
        AiSettings settings = getCurrentSettings();
        boolean newState = !settings.getEnableExternalAi();

        log.info("Toggling external AI from {} to {}", settings.getEnableExternalAi(), newState);
        settings.setEnableExternalAi(newState);

        return settingsRepository.save(settings);
    }
}
