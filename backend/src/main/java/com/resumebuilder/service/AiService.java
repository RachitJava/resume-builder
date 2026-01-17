package com.resumebuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumebuilder.dto.AiDTO;
import com.resumebuilder.dto.ResumeDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${ai.api.url:}")
    private String aiApiUrl;

    @Value("${ai.api.key:}")
    private String aiApiKey;

    @Value("${ai.api.model:gpt-3.5-turbo}")
    private String aiModel;

    public AiDTO.ChatResponse processJobDescription(AiDTO.ChatRequest request) {
        AiDTO.ChatResponse response = new AiDTO.ChatResponse();

        // If AI API is configured, use it
        if (aiApiKey != null && !aiApiKey.isEmpty() && !aiApiKey.equals("your-api-key")) {
            try {
                return callAiApi(request);
            } catch (Exception e) {
                log.error("AI API call failed, falling back to local processing: {}", e.getMessage());
            }
        }

        // Fallback: Local keyword-based processing
        return processLocally(request);
    }

    private AiDTO.ChatResponse callAiApi(AiDTO.ChatRequest request) {
        String prompt = buildPrompt(request);

        AiDTO.OpenAiRequest aiRequest = new AiDTO.OpenAiRequest();
        aiRequest.setModel(aiModel);
        aiRequest.setMessages(List.of(
            new AiDTO.OpenAiRequest.Message("system", 
                "You are a professional resume writer. Analyze job descriptions and suggest resume improvements. " +
                "Return your response as JSON with fields: suggestedSkills (array), suggestedSummary (string), message (string)."),
            new AiDTO.OpenAiRequest.Message("user", prompt)
        ));

        AiDTO.OpenAiResponse aiResponse = webClientBuilder.build()
            .post()
            .uri(aiApiUrl)
            .header("Authorization", "Bearer " + aiApiKey)
            .header("Content-Type", "application/json")
            .bodyValue(aiRequest)
            .retrieve()
            .bodyToMono(AiDTO.OpenAiResponse.class)
            .block();

        if (aiResponse != null && aiResponse.getChoices() != null && !aiResponse.getChoices().isEmpty()) {
            String content = aiResponse.getChoices().get(0).getMessage().getContent();
            return parseAiResponse(content);
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
        
        prompt.append("Based on this job description, suggest:\n");
        prompt.append("1. Key skills to add to the resume\n");
        prompt.append("2. An improved professional summary\n");
        prompt.append("3. Any other suggestions to better match this role\n");
        
        return prompt.toString();
    }

    private AiDTO.ChatResponse parseAiResponse(String content) {
        AiDTO.ChatResponse response = new AiDTO.ChatResponse();
        try {
            // Try to parse as JSON
            Map<String, Object> parsed = objectMapper.readValue(content, Map.class);
            response.setSuggestedSkills((List<String>) parsed.get("suggestedSkills"));
            response.setSuggestedSummary((String) parsed.get("suggestedSummary"));
            response.setMessage((String) parsed.get("message"));
        } catch (Exception e) {
            // If not JSON, use the raw content as message
            response.setMessage(content);
            response.setSuggestedSkills(extractSkillsFromText(content));
        }
        return response;
    }

    private AiDTO.ChatResponse processLocally(AiDTO.ChatRequest request) {
        AiDTO.ChatResponse response = new AiDTO.ChatResponse();
        String jd = request.getJobDescription().toLowerCase();

        // Extract skills based on common keywords
        List<String> suggestedSkills = new ArrayList<>();
        Map<String, List<String>> skillCategories = getSkillCategories();

        for (Map.Entry<String, List<String>> category : skillCategories.entrySet()) {
            for (String skill : category.getValue()) {
                if (jd.contains(skill.toLowerCase())) {
                    suggestedSkills.add(skill);
                }
            }
        }

        // Extract years of experience
        Pattern expPattern = Pattern.compile("(\\d+)\\+?\\s*(?:years?|yrs?)\\s*(?:of)?\\s*(?:experience)?", Pattern.CASE_INSENSITIVE);
        Matcher expMatcher = expPattern.matcher(request.getJobDescription());
        String experience = expMatcher.find() ? expMatcher.group(1) + "+ years" : "";

        // Generate summary
        String summary = generateSummary(jd, suggestedSkills, experience);

        response.setSuggestedSkills(suggestedSkills.stream().distinct().limit(15).toList());
        response.setSuggestedSummary(summary);
        response.setMessage(String.format(
            "Based on the job description, I've identified %d relevant skills and generated a tailored summary. " +
            "Review the suggestions and click 'Apply' to update your resume.",
            suggestedSkills.size()
        ));

        return response;
    }

    private Map<String, List<String>> getSkillCategories() {
        Map<String, List<String>> categories = new HashMap<>();
        
        categories.put("programming", Arrays.asList(
            "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin"
        ));
        
        categories.put("frontend", Arrays.asList(
            "React", "Angular", "Vue.js", "Next.js", "HTML", "CSS", "Tailwind", "Bootstrap", "SASS", "Redux"
        ));
        
        categories.put("backend", Arrays.asList(
            "Node.js", "Spring Boot", "Django", "Flask", "Express", ".NET", "FastAPI", "GraphQL", "REST API"
        ));
        
        categories.put("database", Arrays.asList(
            "MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle", "SQL Server", "DynamoDB", "Cassandra"
        ));
        
        categories.put("cloud", Arrays.asList(
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "CI/CD", "DevOps"
        ));
        
        categories.put("data", Arrays.asList(
            "Machine Learning", "Data Science", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Spark", "Hadoop"
        ));
        
        categories.put("soft", Arrays.asList(
            "Agile", "Scrum", "Leadership", "Communication", "Problem Solving", "Team Collaboration"
        ));
        
        return categories;
    }

    private String generateSummary(String jd, List<String> skills, String experience) {
        String role = extractRole(jd);
        String topSkills = skills.isEmpty() ? "various technologies" : String.join(", ", skills.subList(0, Math.min(4, skills.size())));
        
        return String.format(
            "Results-driven %s professional%s with expertise in %s. " +
            "Proven track record of delivering high-quality solutions and driving business value. " +
            "Strong problem-solving abilities with a focus on innovation and continuous improvement.",
            role,
            experience.isEmpty() ? "" : " with " + experience + " of experience",
            topSkills
        );
    }

    private String extractRole(String jd) {
        String[] roles = {"Software Engineer", "Developer", "Architect", "Manager", "Analyst", "Designer", "Consultant"};
        for (String role : roles) {
            if (jd.contains(role.toLowerCase())) {
                return role;
            }
        }
        return "Software";
    }

    private List<String> extractSkillsFromText(String text) {
        List<String> skills = new ArrayList<>();
        Map<String, List<String>> categories = getSkillCategories();
        String lowerText = text.toLowerCase();
        
        for (List<String> categorySkills : categories.values()) {
            for (String skill : categorySkills) {
                if (lowerText.contains(skill.toLowerCase())) {
                    skills.add(skill);
                }
            }
        }
        return skills;
    }
}

