package com.resumebuilder.controller;

import com.resumebuilder.dto.AiSettingsDTO;
import com.resumebuilder.entity.AiSettings;
import com.resumebuilder.service.AiSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/ai-settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiSettingsController {

    private final AiSettingsService aiSettingsService;

    /**
     * Get current AI settings and usage stats
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getSettings() {
        AiSettings settings = aiSettingsService.getCurrentSettings();

        Map<String, Object> response = new HashMap<>();
        response.put("enableExternalAi", settings.getEnableExternalAi());
        response.put("preferredProvider", settings.getPreferredProvider());
        response.put("enableAdaptiveDifficulty", settings.getEnableAdaptiveDifficulty());
        response.put("enableAiEnhancedFeedback", settings.getEnableAiEnhancedFeedback());
        response.put("maxTokensPerRequest", settings.getMaxTokensPerRequest());
        response.put("dailyTokenBudget", settings.getDailyTokenBudget());
        response.put("monthlyTokenBudget", settings.getMonthlyTokenBudget());
        response.put("tokensUsedToday", settings.getTokensUsedToday());
        response.put("tokensUsedThisMonth", settings.getTokensUsedThisMonth());
        response.put("intelligenceApiUrl", settings.getIntelligenceApiUrl());
        response.put("canUseExternalAi", settings.canUseExternalAi());

        // Add cost estimate
        double costPerMillionTokens = 0.10; // Groq pricing (very cheap)
        double estimatedCostToday = (settings.getTokensUsedToday() / 1_000_000.0) * costPerMillionTokens;
        double estimatedCostMonth = (settings.getTokensUsedThisMonth() / 1_000_000.0) * costPerMillionTokens;

        response.put("estimatedCostToday", String.format("$%.4f", estimatedCostToday));
        response.put("estimatedCostMonth", String.format("$%.4f", estimatedCostMonth));

        return ResponseEntity.ok(response);
    }

    /**
     * Update AI settings (admin only)
     */
    @PutMapping
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody AiSettingsDTO dto) {
        AiSettings updated = aiSettingsService.updateSettings(dto);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "AI settings updated successfully");
        response.put("enableExternalAi", updated.getEnableExternalAi());
        response.put("preferredProvider", updated.getPreferredProvider());

        return ResponseEntity.ok(response);
    }

    /**
     * Quick toggle for external AI (ON/OFF switch)
     */
    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleExternalAi() {
        AiSettings updated = aiSettingsService.toggleExternalAi();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("enableExternalAi", updated.getEnableExternalAi());
        response.put("message", updated.getEnableExternalAi()
                ? "External AI enabled - This will cost money!"
                : "External AI disabled - Using free built-in intelligence");

        return ResponseEntity.ok(response);
    }

    /**
     * Get Intelligence API status
     */
    @GetMapping("/intelligence-api/status")
    public ResponseEntity<Map<String, Object>> getIntelligenceApiStatus() {
        AiSettings settings = aiSettingsService.getCurrentSettings();

        Map<String, Object> response = new HashMap<>();
        response.put("apiUrl", settings.getIntelligenceApiUrl());
        response.put("builtInIntelligence", Map.of(
                "status", "active",
                "cost", "FREE",
                "features", java.util.List.of(
                        "Smart question selection",
                        "Intelligent answer evaluation",
                        "Adaptive difficulty",
                        "Performance analytics")));
        response.put("externalAi", Map.of(
                "enabled", settings.getEnableExternalAi(),
                "provider", settings.getPreferredProvider(),
                "cost", "Variable (pay-per-use)",
                "enhances", "Feedback quality and context"));
        response.put("recommendation", settings.getEnableExternalAi()
                ? "External AI is enabled. Monitor token usage to control costs."
                : "Using built-in intelligence (FREE). Enable external AI for enhanced features.");

        return ResponseEntity.ok(response);
    }

    /**
     * Reset usage statistics (admin only - for testing)
     */
    @PostMapping("/reset-usage")
    public ResponseEntity<Map<String, String>> resetUsage() {
        AiSettings settings = aiSettingsService.getCurrentSettings();
        settings.resetDailyUsage();
        settings.resetMonthlyUsage();

        return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "Usage statistics reset"));
    }
}
