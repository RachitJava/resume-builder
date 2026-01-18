package com.resumebuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumebuilder.dto.AiDTO;
import com.resumebuilder.dto.ResumeDTO;
import com.resumebuilder.entity.AiProviderConfig;
import com.resumebuilder.repository.AiProviderConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final AiProviderConfigRepository aiProviderConfigRepository;

    @Value("${ai.api.url:}")
    private String defaultAiApiUrl;

    @Value("${ai.api.key:}")
    private String defaultAiApiKey;

    @Value("${ai.api.model:gpt-3.5-turbo}")
    private String defaultAiModel;

    private static class EffectiveConfig {
        String url;
        String key;
        String model;
        AiProviderConfig dbConfig;
    }

    private EffectiveConfig getEffectiveConfig() {
        EffectiveConfig config = new EffectiveConfig();
        Optional<AiProviderConfig> dbConfigOpt = aiProviderConfigRepository.findByActiveTrue();

        if (dbConfigOpt.isPresent()) {
            AiProviderConfig c = dbConfigOpt.get();
            config.url = c.getApiUrl();
            config.model = c.getModelName();
            if (c.getApiKeys() != null && !c.getApiKeys().isEmpty()) {
                config.key = c.getApiKeys().get(c.getCurrentKeyIndex() % c.getApiKeys().size());
                log.info("Using AI Config from DATABASE. Provider: {}, KeyIndex: {}, KeyMask: ...{}",
                        c.getProviderName(), c.getCurrentKeyIndex(),
                        config.key.length() > 6 ? config.key.substring(config.key.length() - 6) : "short");
            } else {
                config.key = defaultAiApiKey;
                log.info("Using AI Config from DATABASE (Fallback to Env Key). Provider: {}", c.getProviderName());
            }
            config.dbConfig = c;
        } else {
            config.url = defaultAiApiUrl;
            config.key = defaultAiApiKey;
            config.model = defaultAiModel;
            log.info("Using AI Config from APPLICATION.PROPERTIES (No active DB config). URL: {}", config.url);
        }
        return config;
    }

    private void handleRateLimit(EffectiveConfig config) {
        if (config.dbConfig != null && config.dbConfig.getApiKeys().size() > 1) {
            int nextIndex = (config.dbConfig.getCurrentKeyIndex() + 1) % config.dbConfig.getApiKeys().size();
            config.dbConfig.setCurrentKeyIndex(nextIndex);
            aiProviderConfigRepository.save(config.dbConfig);
            log.info("Rate limit hit. Rotated to key index {} for provider {}", nextIndex,
                    config.dbConfig.getProviderName());
        }
    }

    public AiDTO.ChatResponse processJobDescription(AiDTO.ChatRequest request) {
        EffectiveConfig config = getEffectiveConfig();

        boolean hasKey = config.key != null && !config.key.trim().isEmpty() && !config.key.equals("your-api-key");

        log.info("Checking configuration: URL={}, hasKey={}", config.url, hasKey);

        if (hasKey) {
            try {
                return callAiApi(request, config);
            } catch (Exception e) {
                log.error("AI API call failed, falling back to local processing: {}", e.getMessage());
                if (e.getMessage().contains("429"))
                    handleRateLimit(config);
            }
        }

        return processLocally(request);
    }

    private AiDTO.ChatResponse callAiApi(AiDTO.ChatRequest request, EffectiveConfig config) {
        String prompt = buildPrompt(request);
        String systemPrompt = "You are a professional resume writer. Analyze job descriptions and suggest resume improvements. Return your response as JSON with fields: suggestedSkills (array), suggestedSummary (string), message (string).";

        AiDTO.OpenAiRequest aiRequest = new AiDTO.OpenAiRequest();
        aiRequest.setModel(config.model);
        aiRequest.setMessages(List.of(
                new AiDTO.OpenAiRequest.Message("system", systemPrompt),
                new AiDTO.OpenAiRequest.Message("user", prompt)));

        try {
            AiDTO.OpenAiResponse aiResponse = webClientBuilder.build()
                    .post()
                    .uri(config.url)
                    .header("Authorization", "Bearer " + config.key)
                    .header("Content-Type", "application/json")
                    .bodyValue(aiRequest)
                    .retrieve()
                    .bodyToMono(AiDTO.OpenAiResponse.class)
                    .block();

            if (aiResponse != null && aiResponse.getChoices() != null && !aiResponse.getChoices().isEmpty()) {
                String content = aiResponse.getChoices().get(0).getMessage().getContent();
                return parseAiContent(content);
            }
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 429)
                handleRateLimit(config);
            throw e;
        } catch (Exception e) {
            log.error("AI API Error", e);
        }

        return processLocally(request);
    }

    private String buildPrompt(AiDTO.ChatRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Job Description:\n").append(request.getJobDescription()).append("\n\n");
        if (request.getCurrentResume() != null) {
            prompt.append("Current Resume Skills: ").append(request.getCurrentResume().getSkills()).append("\n");
            prompt.append("Current Summary: ").append(request.getCurrentResume().getSummary()).append("\n\n");
        }
        prompt.append(
                "Based on this job description, suggest:\n1. Key skills to add to the resume\n2. An improved professional summary\n3. Any other suggestions to better match this role\n");
        return prompt.toString();
    }

    private AiDTO.ChatResponse processLocally(AiDTO.ChatRequest request) {
        AiDTO.ChatResponse response = new AiDTO.ChatResponse();
        String jd = request.getJobDescription().toLowerCase();
        List<String> suggestedSkills = extractSkillsFromText(jd);
        Pattern expPattern = Pattern.compile("(\\d+)\\+?\\s*(?:years?|yrs?)\\s*(?:of)?\\s*(?:experience)?",
                Pattern.CASE_INSENSITIVE);
        Matcher expMatcher = expPattern.matcher(request.getJobDescription());
        String experience = expMatcher.find() ? expMatcher.group(1) + "+ years" : "";
        String summary = generateSummary(jd, suggestedSkills, experience);
        response.setSuggestedSkills(suggestedSkills.stream().distinct().limit(15).toList());
        response.setSuggestedSummary(summary);
        response.setMessage(String.format(
                "Based on the job description, I've identified %d relevant skills and generated a tailored summary.",
                suggestedSkills.size()));
        return response;
    }

    private Map<String, List<String>> getSkillCategories() {
        Map<String, List<String>> categories = new HashMap<>();
        categories.put("programming", Arrays.asList("Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go",
                "Rust", "Ruby", "PHP", "Swift", "Kotlin"));
        categories.put("frontend", Arrays.asList("React", "Angular", "Vue.js", "Next.js", "HTML", "CSS", "Tailwind",
                "Bootstrap", "SASS", "Redux"));
        categories.put("backend", Arrays.asList("Node.js", "Spring Boot", "Django", "Flask", "Express", ".NET",
                "FastAPI", "GraphQL", "REST API"));
        categories.put("database", Arrays.asList("MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle", "SQL Server",
                "DynamoDB", "Cassandra"));
        categories.put("cloud", Arrays.asList("AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins",
                "CI/CD", "DevOps"));
        categories.put("data", Arrays.asList("Machine Learning", "Data Science", "TensorFlow", "PyTorch", "Pandas",
                "NumPy", "Spark", "Hadoop"));
        categories.put("soft", Arrays.asList("Agile", "Scrum", "Leadership", "Communication", "Problem Solving",
                "Team Collaboration"));
        return categories;
    }

    private String generateSummary(String jd, List<String> skills, String experience) {
        String role = extractRole(jd);
        String topSkills = skills.isEmpty() ? "various technologies"
                : String.join(", ", skills.subList(0, Math.min(4, skills.size())));
        return String.format("Results-driven %s professional%s with expertise in %s.", role,
                experience.isEmpty() ? "" : " with " + experience + " of experience", topSkills);
    }

    private String extractRole(String jd) {
        String[] roles = { "Software Engineer", "Developer", "Architect", "Manager", "Analyst", "Designer",
                "Consultant" };
        for (String role : roles) {
            if (jd.contains(role.toLowerCase()))
                return role;
        }
        return "Software";
    }

    private List<String> extractSkillsFromText(String text) {
        List<String> skills = new ArrayList<>();
        Map<String, List<String>> categories = getSkillCategories();
        String lowerText = text.toLowerCase();
        for (List<String> categorySkills : categories.values()) {
            for (String skill : categorySkills) {
                if (lowerText.contains(skill.toLowerCase()))
                    skills.add(skill);
            }
        }
        return skills;
    }

    public AiDTO.ChatResponse chatWithResume(AiDTO.ChatRequest request) {
        EffectiveConfig config = getEffectiveConfig();
        boolean hasKey = config.key != null && !config.key.trim().isEmpty() && !config.key.equals("your-api-key");

        log.info("Chat config check: hasKey={}", hasKey);

        if (!hasKey) {
            log.warn("Returning 'not configured' because hasKey={}", hasKey);
            AiDTO.ChatResponse resp = new AiDTO.ChatResponse();
            resp.setMessage("AI API is not configured.");
            return resp;
        }

        try {
            String resumeJson = objectMapper.writeValueAsString(request.getCurrentResume());
            String prompt = String.format(
                    """
                            You are a professional resume editor assistant.
                            Current Resume (JSON):
                            %s

                            User Request:
                            %s

                            Instructions:
                            1. Analyze the request. If it requires updating the resume (e.g. adding experience, changing summary), modify the JSON data accordingly.
                            2. If the user provides specific details (e.g. "Add Google experience"), use them. If they say "Add valid experience", you may generate a placeholder or realistic example.
                            3. Return your response strictly as a JSON object with this structure:
                            {
                              "message": "Your text response to the user",
                              "suggestedUpdates": { ... The Full Updated Resume JSON ... }
                            }
                            4. If no updates are needed, set "suggestedUpdates" to null.
                            5. Ensure the JSON is valid.
                            """,
                    resumeJson, request.getMessage());

            String systemPrompt = "You are a helpful JSON-speaking resume assistant. You ALWAYS reply in valid JSON. Do not use Markdown. Output only the raw JSON string.";

            AiDTO.OpenAiRequest aiRequest = new AiDTO.OpenAiRequest();
            aiRequest.setModel(config.model);
            aiRequest.setMessages(List.of(
                    new AiDTO.OpenAiRequest.Message("system", systemPrompt),
                    new AiDTO.OpenAiRequest.Message("user", prompt)));

            AiDTO.OpenAiResponse aiResponse = webClientBuilder.build()
                    .post()
                    .uri(config.url)
                    .header("Authorization", "Bearer " + config.key)
                    .header("Content-Type", "application/json")
                    .bodyValue(aiRequest)
                    .retrieve()
                    .bodyToMono(AiDTO.OpenAiResponse.class)
                    .block();

            if (aiResponse != null && aiResponse.getChoices() != null && !aiResponse.getChoices().isEmpty()) {
                String content = aiResponse.getChoices().get(0).getMessage().getContent();
                return parseAiContent(content);
            }
            return new AiDTO.ChatResponse();

        } catch (WebClientResponseException e) {
            log.error("AI API Error: Status {}, Body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429)
                handleRateLimit(config);
            AiDTO.ChatResponse fail = new AiDTO.ChatResponse();
            fail.setMessage("AI Service Error (" + e.getStatusCode() + "): " + e.getResponseBodyAsString());
            return fail;
        } catch (Exception e) {
            log.error("Error in chat", e);
            throw new RuntimeException("AI processing failed: " + e.getMessage());
        }
    }

    private AiDTO.ChatResponse parseAiContent(String content) {
        AiDTO.ChatResponse response = new AiDTO.ChatResponse();
        try {
            String cleanContent = content.trim();
            if (cleanContent.startsWith("```json"))
                cleanContent = cleanContent.substring(7);
            else if (cleanContent.startsWith("```"))
                cleanContent = cleanContent.substring(3);
            if (cleanContent.endsWith("```"))
                cleanContent = cleanContent.substring(0, cleanContent.length() - 3);
            cleanContent = cleanContent.trim();
            Map<String, Object> parsed = objectMapper.readValue(cleanContent, Map.class);
            if (parsed.get("message") != null)
                response.setMessage((String) parsed.get("message"));
            if (parsed.get("suggestedUpdates") != null) {
                String updatesJson = objectMapper.writeValueAsString(parsed.get("suggestedUpdates"));
                ResumeDTO updates = objectMapper.readValue(updatesJson, ResumeDTO.class);
                response.setSuggestedUpdates(updates);
            }
            if (parsed.get("suggestedSkills") != null)
                response.setSuggestedSkills((List<String>) parsed.get("suggestedSkills"));
            if (parsed.get("suggestedSummary") != null)
                response.setSuggestedSummary((String) parsed.get("suggestedSummary"));
        } catch (Exception e) {
            log.error("AI Parse Error. Content: {}", content, e);
            response.setMessage("I received a response but couldn't process the format. Raw: " + content);
            response.setSuggestedSkills(extractSkillsFromText(content));
        }
        return response;
    }

    public AiDTO.OptimizeResponse optimizeResumeForOnePage(AiDTO.OptimizeRequest request) {
        ResumeDTO currentResume = request.getCurrentResume();
        AiDTO.OptimizeResponse optimized = new AiDTO.OptimizeResponse();
        List<String> changes = new ArrayList<>();

        optimized.setFullName(currentResume.getFullName());
        optimized.setEmail(currentResume.getEmail());
        optimized.setPhone(currentResume.getPhone());
        optimized.setLocation(currentResume.getLocation());
        optimized.setLinkedIn(currentResume.getLinkedIn());
        optimized.setGithub(currentResume.getGithub());
        optimized.setWebsite(currentResume.getWebsite());
        optimized.setTemplate(currentResume.getTemplate());

        if (currentResume.getSummary() != null && !currentResume.getSummary().isEmpty()) {
            String optimizedSummary = aggressivelyOptimizeSummary(currentResume.getSummary());
            optimized.setSummary(optimizedSummary);
            if (!optimizedSummary.equals(currentResume.getSummary())) {
                changes.add(String.format("Condensed summary from %d to %d characters",
                        currentResume.getSummary().length(), optimizedSummary.length()));
            }
        }

        if (currentResume.getExperience() != null) {
            List<ResumeDTO.Experience> optimizedExp = new ArrayList<>();
            List<ResumeDTO.Experience> recentJobs = currentResume.getExperience().stream().limit(3).toList();
            if (currentResume.getExperience().size() > 3) {
                changes.add(String.format("Kept only %d most recent positions", 3));
            }
            for (ResumeDTO.Experience exp : recentJobs) {
                ResumeDTO.Experience newExp = new ResumeDTO.Experience();
                newExp.setCompany(exp.getCompany());
                newExp.setPosition(exp.getPosition());
                newExp.setHighlights(exp.getHighlights() != null
                        ? exp.getHighlights().stream().limit(3).map(this::aggressivelyOptimizeBullet).toList()
                        : null);
                optimizedExp.add(newExp);
            }
            optimized.setExperience(optimizedExp);
        }

        optimized.setSkills(currentResume.getSkills() != null && currentResume.getSkills().size() > 10
                ? currentResume.getSkills().stream().limit(10).toList()
                : currentResume.getSkills());
        optimized.setChanges(changes);
        optimized
                .setMessage(changes.isEmpty() ? "Resume is well-optimized." : "Applied optimizations to fit one page.");
        return optimized;
    }

    private String aggressivelyOptimizeSummary(String summary) {
        String optimized = summary.replaceAll("\\s+", " ").trim();
        if (optimized.length() > 250)
            optimized = optimized.substring(0, 247) + "...";
        return optimized;
    }

    private String aggressivelyOptimizeBullet(String bullet) {
        return bullet.trim();
    }

    public Map<String, String> generateTemplateMetadata(String description) {
        EffectiveConfig config = getEffectiveConfig();
        boolean hasKey = config.key != null && !config.key.trim().isEmpty() && !config.key.equals("your-api-key");

        if (!hasKey) {
            Map<String, String> fallback = new HashMap<>();
            fallback.put("name", "New Template");
            fallback.put("description", description);
            fallback.put("baseStyle", "modern");
            fallback.put("country", "usa");
            return fallback;
        }

        try {
            String systemPrompt = "You are a creative assistant helping generate metadata for a resume template. Return strictly valid JSON.";
            String userPrompt = String.format(
                    "User description: \"%s\"\n" +
                            "Available base styles: modern, classic, minimal, executive, creative, ats, twocolumn, developer.\n"
                            +
                            "Task: Analyze the description and select the best fitting base style. Generate a creative Name and a polished Description. Guess the best Country code (usa, india, europe) if implied, default to usa.\n"
                            +
                            "Return JSON format: {\"name\": \"...\", \"description\": \"...\", \"baseStyle\": \"...\", \"country\": \"...\"}",
                    description);

            AiDTO.OpenAiRequest aiRequest = new AiDTO.OpenAiRequest();
            aiRequest.setModel(config.model);
            aiRequest.setMessages(List.of(
                    new AiDTO.OpenAiRequest.Message("system", systemPrompt),
                    new AiDTO.OpenAiRequest.Message("user", userPrompt)));

            AiDTO.OpenAiResponse aiResponse = webClientBuilder.build()
                    .post()
                    .uri(config.url)
                    .header("Authorization", "Bearer " + config.key)
                    .header("Content-Type", "application/json")
                    .bodyValue(aiRequest)
                    .retrieve()
                    .bodyToMono(AiDTO.OpenAiResponse.class)
                    .block();

            if (aiResponse != null && aiResponse.getChoices() != null && !aiResponse.getChoices().isEmpty()) {
                String content = aiResponse.getChoices().get(0).getMessage().getContent();
                return parseTemplateMetadata(content);
            }
        } catch (Exception e) {
            log.error("AI Template Gen Error", e);
        }

        Map<String, String> fallback = new HashMap<>();
        fallback.put("name", "AI Generated Template");
        fallback.put("description", description);
        fallback.put("baseStyle", "modern");
        fallback.put("country", "usa");
        return fallback;
    }

    private Map<String, String> parseTemplateMetadata(String content) {
        try {
            String clean = content.trim();
            if (clean.startsWith("```json"))
                clean = clean.substring(7);
            if (clean.startsWith("```"))
                clean = clean.substring(3);
            if (clean.endsWith("```"))
                clean = clean.substring(0, clean.length() - 3);
            return objectMapper.readValue(clean.trim(), Map.class);
        } catch (Exception e) {
            log.error("Failed to parse template metadata", e);
            return Map.of("name", "AI Template", "baseStyle", "modern", "description", "Generated");
        }
    }
}
