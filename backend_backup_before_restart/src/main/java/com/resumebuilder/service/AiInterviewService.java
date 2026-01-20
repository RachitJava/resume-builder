package com.resumebuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiInterviewService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ai.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String aiApiUrl;

    @Value("${ai.api.key:}")
    private String aiApiKey;

    @Value("${ai.api.model:llama-3.3-70b-versatile}")
    private String aiModel;

    @Autowired
    private com.resumebuilder.repository.QuestionBankRepository questionBankRepository;

    @Autowired(required = false)
    private AiSettingsService aiSettingsService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get the Intelligence API URL from settings or default to localhost
     */
    private String getIntelligenceApiUrl() {
        if (aiSettingsService != null) {
            return aiSettingsService.getCurrentSettings().getIntelligenceApiUrl();
        }
        return "http://localhost:8000";
    }

    /**
     * Check if we should use external AI based on admin settings
     */
    private boolean shouldUseExternalAi() {
        if (aiSettingsService == null) {
            return false; // Default: use built-in intelligence
        }
        return aiSettingsService.canUseExternalAi();
    }

    public Map<String, Object> generateInterviewResponse(Map<String, Object> request) {
        try {
            Map<String, Object> profile = (Map<String, Object>) request.get("profile");
            List<Map<String, Object>> conversationHistory = (List<Map<String, Object>>) request
                    .get("conversationHistory");
            String currentResponse = (String) request.get("currentResponse");

            // Check for fixed questions (Question Bank)
            List<String> fixedQuestions = null;
            System.out.println("DEBUG: Profile keys received: " + profile.keySet());
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
                                // Parse JSON: expecting [{"question": "..."}]
                                List<Map<String, Object>> qList = objectMapper.readValue(questionsJson,
                                        new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {
                                        });
                                fixedQuestions = new ArrayList<>();
                                for (Map<String, Object> q : qList) {
                                    fixedQuestions.add((String) q.get("question"));
                                }
                                // Update profile for prompt generation
                                profile.put("fixedQuestions", fixedQuestions);
                                System.out.println("DEBUG: Fetched " + fixedQuestions.size()
                                        + " questions from DB bankId=" + bankId);
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Error fetching bank in fallback: " + e.getMessage());
                    }
                }
            }

            if (fixedQuestions != null) {
                System.out.println("DEBUG: fixedQuestions found. Size: " + fixedQuestions.size());
            } else {
                System.out.println("DEBUG: No fixedQuestions found in profile or DB.");
            }

            String nextFixedQuestion = null;
            if (fixedQuestions != null && !fixedQuestions.isEmpty() && conversationHistory != null) {
                // Count how many times interviewer has spoken (excluding current generation)
                long interviewerCount = conversationHistory.stream()
                        .filter(m -> "interviewer".equals(m.get("role")))
                        .count();

                System.out.println("DEBUG: Interviewer message count (history): " + interviewerCount);

                // First message is Intro. So message #1 (index 0) corresponds to
                // interviewerCount 1.
                int questionIndex = (int) interviewerCount - 1;
                System.out.println("DEBUG: Calculated questionIndex: " + questionIndex);

                if (questionIndex >= 0 && questionIndex < fixedQuestions.size()) {
                    nextFixedQuestion = fixedQuestions.get(questionIndex);
                    System.out.println("DEBUG: Selected nextFixedQuestion: " + nextFixedQuestion);
                } else {
                    System.out.println("DEBUG: questionIndex out of bounds or list exhausted.");
                }
            } else {
                System.out.println("DEBUG: Skipping fixed question logic (list empty or history null).");
            }

            // Build system prompt based on interview type
            // Pass true if we have a fixed question ready forcing AI to only evaluate
            String systemPrompt = buildSystemPrompt(profile, nextFixedQuestion != null);

            // Build conversation messages
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // Add conversation history
            if (conversationHistory != null) {
                for (Map<String, Object> msg : conversationHistory) {
                    String role = msg.get("role").equals("interviewer") ? "assistant" : "user";
                    messages.add(Map.of("role", role, "content", (String) msg.get("content")));
                }
            }

            // Add current response
            if (currentResponse != null && !currentResponse.isEmpty()) {
                messages.add(Map.of("role", "user", "content", currentResponse));
            }

            // Call AI API
            String aiResponse = callAiApi(messages);
            if (aiResponse == null)
                aiResponse = "";

            // If we have a fixed question, append it to the AI's evaluation
            if (nextFixedQuestion != null) {
                if (aiResponse.trim().isEmpty()) {
                    aiResponse = nextFixedQuestion;
                } else {
                    aiResponse = aiResponse.trim() + "\n\n" + nextFixedQuestion;
                }
            }

            // Determine if interview should end (after 8-10 questions or when fixed list
            // exhausted)
            // Determine if interview should end (after 8-10 questions or when fixed list
            // exhausted)
            boolean shouldEnd;
            if (fixedQuestions != null && !fixedQuestions.isEmpty()) {
                // End ONLY if we have run out of fixed questions to ask
                shouldEnd = (nextFixedQuestion == null);
            } else {
                shouldEnd = conversationHistory != null && conversationHistory.size() >= 16;
            }

            return Map.of(
                    "response", aiResponse,
                    "shouldEnd", shouldEnd);

        } catch (

        Exception e) {
            e.printStackTrace();
            return Map.of("response", "INTERNAL ERROR: " + e.toString() + " Message: " + e.getMessage(), "shouldEnd",
                    false);
        }
    }

    public Map<String, Object> generateFeedback(Map<String, Object> request) {
        try {
            Map<String, Object> profile = (Map<String, Object>) request.get("profile");
            List<Map<String, Object>> conversationHistory = (List<Map<String, Object>>) request
                    .get("conversationHistory");
            Map<String, Object> interviewData = (Map<String, Object>) request.get("interviewData");

            // Build feedback prompt
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

    private String buildSystemPrompt(Map<String, Object> profile, boolean isFixedQuestion) {
        String role = (String) profile.get("role");
        String experience = (String) profile.get("experience");
        String skills = (String) profile.get("skills");
        String interviewType = (String) profile.get("interviewType");
        String customQuestions = (String) profile.getOrDefault("customQuestions", "");

        String accent = (String) profile.getOrDefault("interviewerAccent", "us");

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
        if (!customQuestions.isEmpty())
            prompt.append("Focus: ").append(customQuestions).append("\n");

        prompt.append("\nYour Persona:\n");
        if ("uk".equalsIgnoreCase(accent))
            prompt.append(
                    "- Use British English idioms and spelling. Tone: Polished, professional, slightly formal.\n");
        else if ("in".equalsIgnoreCase(accent))
            prompt.append(
                    "- Use clear, professional Indian English. Tone: Respectful, encouraging, slightly formal. Use 'Please' often.\n");
        else if ("au".equalsIgnoreCase(accent))
            prompt.append(
                    "- Use Australian English. Tone: Friendly, laid-back but professional. Use 'mate' occasionally if rapport is built.\n");
        else
            prompt.append("- Use American English. Tone: Direct, friendly, confident.\n");

        prompt.append("\nInteraction Rules:\n");
        prompt.append(
                "1. **CRITICAL:** Start your response by briefly evaluating the user's PREVIOUS answer (e.g., 'Good point on X' or 'That's not quite right because Y').\n");

        if (isFixedQuestion) {
            prompt.append(
                    "2. Provide a brief evaluation only. Do NOT ask a new question. The system will append the next question.\n");
        } else {
            prompt.append("2. Then, ask the NEXT question. Ask only ONE question at a time.\n");
            prompt.append("3. Keep responses CONVERSATIONAL and BRIEF (2-4 sentences).\n");
        }

        prompt.append("4. Adapt difficulty. Deep dive if answer is good. Hints if stuck.\n");
        prompt.append("5. Be natural. Use fillers like 'I see', 'Interesting', 'Okay' to sound human.\n");

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

    private String callAiApi(List<Map<String, String>> messages) {
        try {
            // First, try using our Intelligence API with built-in intelligence (FREE)
            if (!shouldUseExternalAi()) {
                try {
                    return callIntelligenceApi(messages);
                } catch (Exception e) {
                    System.err.println("Intelligence API failed, using fallback: " + e.getMessage());
                    // Fall through to external AI if Intelligence API is unavailable
                }
            }

            // Only use external AI if admin has enabled it
            if (shouldUseExternalAi() && aiApiKey != null && !aiApiKey.isEmpty()) {
                String response = callExternalAi(messages);

                // Track token usage for cost monitoring
                if (aiSettingsService != null) {
                    int estimatedTokens = estimateTokenCount(messages)
                            + estimateTokenCount(List.of(Map.of("content", response)));
                    aiSettingsService.recordTokenUsage(estimatedTokens);
                }

                return response;
            }

            // If both fail or are disabled, return fallback message
            return "I apologize, but the AI service is currently unavailable. Please try again later.";

        } catch (Exception e) {
            throw new RuntimeException("AI API call failed: " + e.getMessage(), e);
        }
    }

    /**
     * Call our Intelligence API (uses built-in intelligence - FREE)
     */
    private String callIntelligenceApi(List<Map<String, String>> messages) {
        try {
            String apiUrl = getIntelligenceApiUrl();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Send messages directly (conversation endpoint doesn't need extra params)
            Map<String, Object> requestBody = Map.of("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl + "/api/v1/conversation/generate", // Use conversation endpoint (built-in intelligence)
                    HttpMethod.POST,
                    entity,
                    Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("response")) {
                return (String) responseBody.get("response");
            }

            throw new RuntimeException("Invalid response from Intelligence API");

        } catch (Exception e) {
            throw new RuntimeException("Intelligence API call failed: " + e.getMessage(), e);
        }
    }

    /**
     * Call external AI (Groq, OpenAI, etc.) - ONLY if admin enables it
     */
    private String callExternalAi(List<Map<String, String>> messages) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + aiApiKey);

            Map<String, Object> requestBody = Map.of(
                    "model", aiModel,
                    "messages", messages,
                    "temperature", 0.7,
                    "max_tokens", 500);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(aiApiUrl, HttpMethod.POST, entity, Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }

            return "I apologize, but I'm having trouble processing that. Could you please rephrase your answer?";

        } catch (Exception e) {
            throw new RuntimeException("External AI API call failed: " + e.getMessage(), e);
        }
    }

    /**
     * Estimate token count for cost tracking
     */
    private int estimateTokenCount(List<Map<String, String>> messages) {
        int total = 0;
        for (Map<String, String> msg : messages) {
            String content = msg.get("content");
            if (content != null) {
                // Rough estimation: 1 token ≈ 4 characters
                total += content.length() / 4;
            }
        }
        return total;
    }
}
