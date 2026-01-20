package com.resumebuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumebuilder.entity.AiProviderConfig;
import com.resumebuilder.repository.AiProviderConfigRepository;
import com.resumebuilder.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiInterviewService {

    private final RestTemplate restTemplate;
    private final QuestionBankRepository questionBankRepository;
    private final AiSettingsService aiSettingsService;
    private final AiProviderConfigRepository aiProviderConfigRepository;

    @Value("${ai.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String defaultAiApiUrl;

    @Value("${ai.api.key:}")
    private String defaultAiApiKey;

    @Value("${ai.api.model:llama-3.3-70b-versatile}")
    private String defaultAiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // --- Unified Configuration Helper (Matches AiService) ---
    private static class EffectiveConfig {
        String url;
        String key;
        String model;
        AiProviderConfig dbConfig;
    }

    private EffectiveConfig getEffectiveConfig() {
        EffectiveConfig config = new EffectiveConfig();

        // 0. Check Global Switch First
        if (!aiSettingsService.canUseExternalAi()) {
            config.url = defaultAiApiUrl;
            config.key = defaultAiApiKey;
            config.model = defaultAiModel;
            log.info("INTERVIEW AI: External AI is DISABLED globally. Using default/fallback.");
            return config;
        }

        // 1. Try to find specific INTERVIEW config first
        Optional<AiProviderConfig> interviewConfig = aiProviderConfigRepository
                .findByActiveTrueAndType(AiProviderConfig.ProviderType.INTERVIEW);

        // 2. If not found, fall back to ANY active config (legacy behavior)
        if (interviewConfig.isEmpty()) {
            interviewConfig = aiProviderConfigRepository.findByActiveTrue();
        }

        if (interviewConfig.isPresent()) {
            AiProviderConfig c = interviewConfig.get();
            config.url = c.getApiUrl();
            config.model = c.getModelName();
            if (c.getApiKeys() != null && !c.getApiKeys().isEmpty()) {
                config.key = c.getApiKeys().get(c.getCurrentKeyIndex() % c.getApiKeys().size());
                log.info("INTERVIEW AI: Using DB Config. Provider: {}, Type: {}", c.getProviderName(), c.getType());
            } else {
                config.key = defaultAiApiKey;
                log.info("INTERVIEW AI: Using DB Config (Fallback Key). Provider: {}", c.getProviderName());
            }
            config.dbConfig = c;
        } else {
            config.url = defaultAiApiUrl;
            config.key = defaultAiApiKey;
            config.model = defaultAiModel;
            log.info("INTERVIEW AI: Using Default Application Properties Config.");
        }
        return config;
    }

    private void handleRateLimit(EffectiveConfig config) {
        if (config.dbConfig != null && config.dbConfig.getApiKeys().size() > 1) {
            int nextIndex = (config.dbConfig.getCurrentKeyIndex() + 1) % config.dbConfig.getApiKeys().size();
            config.dbConfig.setCurrentKeyIndex(nextIndex);
            aiProviderConfigRepository.save(config.dbConfig);
            log.warn("Rate limit hit during INTERVIEW. Rotated to key index {} for provider {}", nextIndex,
                    config.dbConfig.getProviderName());
        }
    }

    public Map<String, Object> generateInterviewResponse(Map<String, Object> request) {
        try {
            Map<String, Object> profile = (Map<String, Object>) request.get("profile");
            List<Map<String, Object>> conversationHistory = (List<Map<String, Object>>) request
                    .get("conversationHistory");
            String currentResponse = (String) request.get("currentResponse");

            // Check for fixed questions (Question Bank)
            List<String> fixedQuestions = null;
            if (profile.containsKey("fixedQuestions")) {
                fixedQuestions = (List<String>) profile.get("fixedQuestions");
            }

            // Fallback: If fixedQuestions missing but questionBankId present, fetch from DB
            if ((fixedQuestions == null || fixedQuestions.isEmpty()) && profile.containsKey("questionBankId")) {
                String bankId = (String) profile.get("questionBankId");
                if (bankId != null && !bankId.isEmpty()) {
                    try {
                        Optional<com.resumebuilder.entity.QuestionBank> bankOpt = questionBankRepository
                                .findById(bankId);
                        if (bankOpt.isPresent()) {
                            String questionsJson = bankOpt.get().getQuestions();
                            if (questionsJson != null) {
                                List<Map<String, Object>> qList = objectMapper.readValue(questionsJson,
                                        new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {
                                        });
                                fixedQuestions = new ArrayList<>();
                                for (Map<String, Object> q : qList) {
                                    fixedQuestions.add((String) q.get("question"));
                                }
                                profile.put("fixedQuestions", fixedQuestions);
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error fetching bank in fallback: " + e.getMessage());
                    }
                }
            }

            String nextFixedQuestion = null;
            if (fixedQuestions != null && !fixedQuestions.isEmpty() && conversationHistory != null) {
                long interviewerCount = conversationHistory.stream()
                        .filter(m -> "interviewer".equals(m.get("role")))
                        .count();
                int questionIndex = (int) interviewerCount - 1;

                if (questionIndex >= 0 && questionIndex < fixedQuestions.size()) {
                    nextFixedQuestion = fixedQuestions.get(questionIndex);
                }
            }

            // Build system prompt based on interview type
            String systemPrompt = buildSystemPrompt(profile, nextFixedQuestion);

            // Build conversation messages
            List<Map<String, String>> messages = new ArrayList<>();
            // Hack for Google/OpenRouter models that dislike "system" role or Developer
            // Instructions
            messages.add(Map.of("role", "user", "content", systemPrompt));
            messages.add(Map.of("role", "assistant", "content",
                    "Understood. I am ready to conduct the interview structure as requested."));

            // Add conversation history
            if (conversationHistory != null) {
                for (Map<String, Object> msg : conversationHistory) {
                    // Normalize roles for API
                    String role = "interviewer".equals(msg.get("role")) ? "assistant" : "user";
                    messages.add(Map.of("role", role, "content", (String) msg.get("content")));
                }
            }

            // Add current response
            if (currentResponse != null && !currentResponse.isEmpty()) {
                messages.add(Map.of("role", "user", "content", currentResponse));
            }

            // Call AI API using Effective Configuration
            String aiResponse = callAiApi(messages);
            if (aiResponse == null)
                aiResponse = "";

            // Removed force append logic to prevent double questioning.
            // The AI is now instructed via System Prompt to ask the fixed question itself.

            boolean shouldEnd;
            if (fixedQuestions != null && !fixedQuestions.isEmpty()) {
                shouldEnd = (nextFixedQuestion == null);
            } else {
                shouldEnd = conversationHistory != null && conversationHistory.size() >= 16;
            }

            return Map.of("response", aiResponse, "shouldEnd", shouldEnd);

        } catch (Exception e) {
            log.error("Interview Generation Error", e);
            return Map.of("response",
                    "I encountered an error processing that. Please try again. (" + e.getMessage() + ")", "shouldEnd",
                    false);
        }
    }

    public Map<String, Object> generateFeedback(Map<String, Object> request) {
        try {
            Map<String, Object> profile = (Map<String, Object>) request.get("profile");
            List<Map<String, Object>> conversationHistory = (List<Map<String, Object>>) request
                    .get("conversationHistory");
            Map<String, Object> interviewData = (Map<String, Object>) request.get("interviewData");

            String feedbackPrompt = buildFeedbackPrompt(profile, conversationHistory, interviewData);

            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content",
                            "You are an expert technical interviewer providing detailed feedback."),
                    Map.of("role", "user", "content", feedbackPrompt));

            String feedbackText = callAiApi(messages);

            return Map.of("summary", feedbackText);

        } catch (Exception e) {
            throw new RuntimeException("Error generating feedback: " + e.getMessage(), e);
        }
    }

    private String buildSystemPrompt(Map<String, Object> profile, String nextFixedQuestion) {
        String role = (String) profile.get("role");
        String experience = (String) profile.get("experience");
        String skills = (String) profile.get("skills");
        String interviewType = (String) profile.get("interviewType");
        String customQuestions = (String) profile.getOrDefault("customQuestions", "");
        String accent = (String) profile.getOrDefault("interviewerAccent", "us");
        String resumeContext = (String) profile.getOrDefault("resumeContext", "");

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a professional technical interviewer conducting a ");

        switch (interviewType) {
            case "hr":
                prompt.append("HR/Behavioral interview");
                break;
            case "technical":
                prompt.append("Technical interview");
                break;
            case "coding":
                prompt.append("Coding interview");
                break;
            case "technical_coding":
                prompt.append("Technical + Coding interview");
                break;
            case "mixed":
                prompt.append("Mixed Round");
                break;
        }

        prompt.append(" for a ").append(role).append(" position.\n");
        prompt.append("Candidate Profile: Experience: ").append(experience).append(", Skills: ").append(skills)
                .append("\n");

        if (!resumeContext.isEmpty()) {
            prompt.append("\n\nRESUME CONTEXT FROM CANDIDATE:\n");
            prompt.append(resumeContext).append("\n");
            prompt.append(
                    "INSTRUCTION: Use the above resume context to contextualize your questions. Ask about their specific projects and experience mentioned in the resume. IMPORTANT: Ask only ONE question at a time.\n");
        }

        if (!customQuestions.isEmpty())
            prompt.append("Focus: ").append(customQuestions).append("\n");

        prompt.append("\nYour Persona:\n");
        if ("uk".equalsIgnoreCase(accent)) {
            prompt.append("- Use British English idioms. Tone: Polished, professional.\n");
        } else {
            // Default to Indian Professional as requested for "Calm Indian Voice"
            prompt.append("- You are a Calm Indian Technical Interviewer.\n");
            prompt.append("- Use clear, professional Indian English.\n");
            prompt.append(
                    "- Tone: Very calm, respectful, patient, and encouraging (use words like 'Good', 'Okay', 'Right').\n");
            prompt.append("- Speak at a moderate, steady pace.\n");
        }

        prompt.append("\nInteraction Rules:\n");
        prompt.append(
                "1. **CRITICAL:** Start by briefly evaluating/acknowledging the user's PREVIOUS answer (e.g., 'That's a great point', 'I see').\n");
        prompt.append(
                "2. **ONE QUESTION RULE:** Ask EXACTLY ONE question at a time. NEVER ask multiple questions in one turn.\n");
        prompt.append(
                "3. **Cross-Questions:** If the candidate's answer is interesting or needs clarification, ask ONE follow-up question. Do NOT move to the next main question yet. Treat the follow-up as a standalone turn.\n");

        if (nextFixedQuestion != null) {
            prompt.append("4. **STRICT SCRIPT MODE:**\n");
            prompt.append("   - You MUST ask the following question EXACTLY:\n");
            prompt.append("     \"" + nextFixedQuestion + "\"\n");
            prompt.append("   - Acknowledge the previous answer briefly, then ask ONLY the question above.\n");
            prompt.append("   - Do NOT ask any other follow-up or extra questions.\n");
        } else {
            prompt.append(
                    "4. **Flow:** Keep the conversation smooth. Don't jump topics abruptly. Use transition phrases.\n");
        }

        prompt.append("5. **Tone:** Be human, warm, encouraging, and professional. Avoid robotic repetition.\n");
        prompt.append("6. **Length:** Keep your responses concise (2-3 sentences max).\n");

        return prompt.toString();
    }

    private String buildFeedbackPrompt(Map<String, Object> profile, List<Map<String, Object>> conversationHistory,
            Map<String, Object> interviewData) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze this interview and provide detailed feedback.\n\n");
        prompt.append("Candidate: ").append(profile.get("name")).append("\n");
        prompt.append("Role: ").append(profile.get("role")).append("\n");
        prompt.append("Experience: ").append(profile.get("experience")).append("\n\n");

        prompt.append("Interview Transcript:\n");
        if (conversationHistory != null) {
            for (Map<String, Object> msg : conversationHistory) {
                String speaker = msg.get("role").equals("interviewer") ? "Interviewer" : "Candidate";
                prompt.append(speaker).append(": ").append(msg.get("content")).append("\n\n");
            }
        }

        prompt.append("\nProvide feedback in this format:\n\n");
        prompt.append("**Technical Score:** X/10\n");
        prompt.append("**Communication Score:** X/10\n");
        prompt.append("**Problem Solving Score:** X/10\n\n");
        prompt.append("**Strengths:**\n- [List 2-3 strengths]\n\n");
        prompt.append("**Weaknesses:**\n- [List 2-3 areas for improvement]\n\n");
        prompt.append("**Final Verdict:** [Selected/Borderline/Rejected]\n\n");
        prompt.append("**Improvement Suggestions:**\n- [List 2-3 specific suggestions]\n\n");
        prompt.append("Be honest but constructive. Focus on specific examples from the interview.");

        return prompt.toString();
    }

    // --- Core API Caller with Rotation Strategy ---
    private String callAiApi(List<Map<String, String>> messages) {
        EffectiveConfig config = getEffectiveConfig();

        // Fast-fail if not configured
        if (config.key == null || config.key.trim().isEmpty() || config.key.equals("your-api-key")) {
            return "I apologize, but the AI service is not properly configured. Please contact the administrator.";
        }

        try {
            return executeRequest(config, messages);
        } catch (Exception e) {
            log.error("Primary AI Config Failed: {}", e.getMessage());
            // Attempt rotation if rate limited or unauthorized
            if (e.getMessage() != null && (e.getMessage().contains("429") || e.getMessage().contains("401"))) {
                if (config.dbConfig != null) {
                    handleRateLimit(config);
                    // Retry once with new config (simplified recursion or re-fetch)
                    log.info("Retrying with rotated key...");
                    return executeRequest(getEffectiveConfig(), messages);
                }
            }
            return "I apologize, but I'm having trouble connecting to the AI interviewer right now.";
        }
    }

    private String executeRequest(EffectiveConfig config, List<Map<String, String>> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Handle OpenRouter specifics (optional but good practice)
        if (config.url.contains("openrouter")) {
            headers.set("Authorization", "Bearer " + config.key);
            headers.set("HTTP-Referer", "https://resume-builder.com"); // Required for OpenRouter
            headers.set("X-Title", "Resume Builder AI");
        } else {
            headers.set("Authorization", "Bearer " + config.key);
        }

        Map<String, Object> requestBody = Map.of(
                "model", config.model,
                "messages", messages,
                "temperature", 0.7,
                "max_tokens", 500);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.exchange(config.url, HttpMethod.POST, entity, Map.class);

        Map<String, Object> responseBody = response.getBody();
        if (responseBody != null && responseBody.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        }
        throw new RuntimeException("Empty response from AI provider");
    }
}
