package com.resumebuilder.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumebuilder.dto.JobMatchDTO;
import com.resumebuilder.dto.ResumeDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
@Slf4j
public class JobMatchService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${ai.api.url}")
    private String aiApiUrl;

    @Value("${ai.api.key}")
    private String aiApiKey;

    @Value("${ai.api.model}")
    private String aiModel;

    public JobMatchService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
            .build();
        this.objectMapper = objectMapper;
    }

    public JobMatchDTO.JobAnalysisResponse analyzeAndCreateResume(JobMatchDTO.JobAnalysisRequest request) {
        log.info("Analyzing job description for: {}", request.getJobTitle());
        
        try {
            // Step 1: Analyze the job description
            String analysisPrompt = buildAnalysisPrompt(request);
            String analysisResult = callAI(analysisPrompt);
            
            // Step 2: Parse the analysis
            JobMatchDTO.JobAnalysisResponse response = parseAnalysisResponse(analysisResult);
            
            // Step 3: Create tailored resume
            String resumePrompt = buildResumePrompt(request, response);
            String resumeResult = callAI(resumePrompt);
            
            // Step 4: Parse the tailored resume
            ResumeDTO tailoredResume = parseResumeResponse(resumeResult);
            response.setTailoredResume(tailoredResume);
            
            // Step 5: Calculate match score if existing resume provided
            if (request.getExistingResume() != null) {
                int matchScore = calculateMatchScore(request.getExistingResume(), response.getRequiredSkills());
                response.setMatchScore(matchScore);
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("Error analyzing job: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to analyze job description: " + e.getMessage());
        }
    }

    private String buildAnalysisPrompt(JobMatchDTO.JobAnalysisRequest request) {
        return """
            Analyze this job posting and extract key information.
            Return ONLY valid JSON with this structure:
            {
                "jobTitle": "extracted job title",
                "company": "company name if found",
                "requiredSkills": ["must-have skills"],
                "preferredSkills": ["nice-to-have skills"],
                "keywords": ["important keywords for ATS"],
                "experienceLevel": "Entry/Mid/Senior/Lead/Executive",
                "summary": "brief summary of what the role needs",
                "suggestions": ["tips to improve resume for this job"]
            }
            
            Job Title: %s
            Company: %s
            
            Job Description:
            \"\"\"
            %s
            \"\"\"
            """.formatted(
                request.getJobTitle() != null ? request.getJobTitle() : "Not specified",
                request.getCompany() != null ? request.getCompany() : "Not specified",
                request.getJobDescription()
            );
    }

    private String buildResumePrompt(JobMatchDTO.JobAnalysisRequest request, JobMatchDTO.JobAnalysisResponse analysis) {
        String existingResumeInfo = "";
        if (request.getExistingResume() != null) {
            ResumeDTO existing = request.getExistingResume();
            existingResumeInfo = """
                
                EXISTING RESUME DATA (tailor this to match the job):
                Name: %s
                Current Skills: %s
                Experience: %s companies
                Education: %s
                
                """.formatted(
                    existing.getFullName(),
                    existing.getSkills() != null ? String.join(", ", existing.getSkills()) : "None",
                    existing.getExperience() != null ? existing.getExperience().size() : 0,
                    existing.getEducation() != null && !existing.getEducation().isEmpty() 
                        ? existing.getEducation().get(0).getDegree() : "Not specified"
                );
        }

        return """
            Create a professional resume tailored for this job.
            %s
            JOB REQUIREMENTS:
            - Title: %s
            - Company: %s
            - Required Skills: %s
            - Keywords to include: %s
            - Experience Level: %s
            
            Create a COMPLETE resume with realistic, professional content.
            The resume should highlight skills and experience relevant to this specific job.
            Include quantifiable achievements (percentages, numbers, metrics).
            
            Return ONLY valid JSON with this exact structure:
            {
                "fullName": "%s",
                "email": "professional@email.com",
                "phone": "+1 (555) 000-0000",
                "location": "City, State",
                "linkedIn": "linkedin.com/in/username",
                "summary": "Professional summary tailored to this job (3-4 sentences highlighting relevant experience)",
                "skills": ["skill1", "skill2", ... include ALL required and preferred skills],
                "experience": [
                    {
                        "company": "Company Name",
                        "position": "Job Title",
                        "startDate": "Month YYYY",
                        "endDate": "Present",
                        "highlights": [
                            "Achievement with metrics relevant to the job",
                            "Another relevant achievement"
                        ]
                    }
                ],
                "education": [
                    {
                        "institution": "University Name",
                        "degree": "Degree Type",
                        "field": "Field of Study",
                        "endDate": "YYYY"
                    }
                ],
                "certifications": ["Relevant certification 1", "Relevant certification 2"],
                "projects": [
                    {
                        "name": "Relevant Project",
                        "description": "Description showing relevant skills",
                        "technologies": ["tech1", "tech2"]
                    }
                ]
            }
            """.formatted(
                existingResumeInfo,
                analysis.getJobTitle(),
                analysis.getCompany() != null ? analysis.getCompany() : "Target Company",
                String.join(", ", analysis.getRequiredSkills()),
                String.join(", ", analysis.getKeywords()),
                analysis.getExperienceLevel(),
                request.getExistingResume() != null ? request.getExistingResume().getFullName() : "John Doe"
            );
    }

    private String callAI(String prompt) {
        try {
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", aiModel);
            
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of(
                "role", "system", 
                "content", "You are an expert career coach and resume writer. Create professional, ATS-optimized resumes. Return only valid JSON."
            ));
            messages.add(Map.of("role", "user", "content", prompt));
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 4096);

            String requestJson = objectMapper.writeValueAsString(requestBody);
            
            String response = webClient.post()
                .uri(aiApiUrl)
                .header("Authorization", "Bearer " + aiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestJson)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode responseJson = objectMapper.readTree(response);
            String content = responseJson.path("choices").path(0).path("message").path("content").asText();
            
            return cleanJsonResponse(content);
            
        } catch (Exception e) {
            log.error("AI call failed: {}", e.getMessage());
            throw new RuntimeException("AI service error: " + e.getMessage());
        }
    }

    private String cleanJsonResponse(String content) {
        content = content.trim();
        if (content.startsWith("```json")) {
            content = content.substring(7);
        } else if (content.startsWith("```")) {
            content = content.substring(3);
        }
        if (content.endsWith("```")) {
            content = content.substring(0, content.length() - 3);
        }
        int startIdx = content.indexOf('{');
        int endIdx = content.lastIndexOf('}');
        if (startIdx >= 0 && endIdx > startIdx) {
            content = content.substring(startIdx, endIdx + 1);
        }
        return content.trim();
    }

    private JobMatchDTO.JobAnalysisResponse parseAnalysisResponse(String json) throws Exception {
        JsonNode node = objectMapper.readTree(json);
        JobMatchDTO.JobAnalysisResponse response = new JobMatchDTO.JobAnalysisResponse();
        
        response.setJobTitle(getTextOrDefault(node, "jobTitle", "Not specified"));
        response.setCompany(getTextOrDefault(node, "company", null));
        response.setExperienceLevel(getTextOrDefault(node, "experienceLevel", "Mid"));
        response.setSummary(getTextOrDefault(node, "summary", ""));
        
        response.setRequiredSkills(getStringList(node, "requiredSkills"));
        response.setPreferredSkills(getStringList(node, "preferredSkills"));
        response.setKeywords(getStringList(node, "keywords"));
        response.setSuggestions(getStringList(node, "suggestions"));
        
        return response;
    }

    private ResumeDTO parseResumeResponse(String json) throws Exception {
        JsonNode node = objectMapper.readTree(json);
        ResumeDTO resume = new ResumeDTO();
        
        resume.setFullName(getTextOrDefault(node, "fullName", "Your Name"));
        resume.setEmail(getTextOrDefault(node, "email", "email@example.com"));
        resume.setPhone(getTextOrDefault(node, "phone", "+1 (555) 000-0000"));
        resume.setLocation(getTextOrDefault(node, "location", "City, State"));
        resume.setLinkedIn(getTextOrDefault(node, "linkedIn", null));
        resume.setGithub(getTextOrDefault(node, "github", null));
        resume.setSummary(getTextOrDefault(node, "summary", ""));
        resume.setSkills(getStringList(node, "skills"));
        resume.setCertifications(getStringList(node, "certifications"));
        
        // Parse experience
        if (node.has("experience") && node.get("experience").isArray()) {
            List<ResumeDTO.Experience> experiences = new ArrayList<>();
            for (JsonNode exp : node.get("experience")) {
                ResumeDTO.Experience experience = new ResumeDTO.Experience();
                experience.setCompany(getTextOrDefault(exp, "company", ""));
                experience.setPosition(getTextOrDefault(exp, "position", ""));
                experience.setStartDate(getTextOrDefault(exp, "startDate", ""));
                experience.setEndDate(getTextOrDefault(exp, "endDate", "Present"));
                experience.setHighlights(getStringList(exp, "highlights"));
                if (experience.getCompany() != null && !experience.getCompany().isEmpty()) {
                    experiences.add(experience);
                }
            }
            resume.setExperience(experiences);
        }
        
        // Parse education
        if (node.has("education") && node.get("education").isArray()) {
            List<ResumeDTO.Education> educations = new ArrayList<>();
            for (JsonNode edu : node.get("education")) {
                ResumeDTO.Education education = new ResumeDTO.Education();
                education.setInstitution(getTextOrDefault(edu, "institution", ""));
                education.setDegree(getTextOrDefault(edu, "degree", ""));
                education.setField(getTextOrDefault(edu, "field", ""));
                education.setEndDate(getTextOrDefault(edu, "endDate", ""));
                if (education.getInstitution() != null && !education.getInstitution().isEmpty()) {
                    educations.add(education);
                }
            }
            resume.setEducation(educations);
        }
        
        // Parse projects
        if (node.has("projects") && node.get("projects").isArray()) {
            List<ResumeDTO.Project> projects = new ArrayList<>();
            for (JsonNode proj : node.get("projects")) {
                ResumeDTO.Project project = new ResumeDTO.Project();
                project.setName(getTextOrDefault(proj, "name", ""));
                project.setDescription(getTextOrDefault(proj, "description", ""));
                project.setTechnologies(getStringList(proj, "technologies"));
                if (project.getName() != null && !project.getName().isEmpty()) {
                    projects.add(project);
                }
            }
            resume.setProjects(projects);
        }
        
        resume.setTemplate("ats");
        return resume;
    }

    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        if (node.has(field) && !node.get(field).isNull()) {
            String value = node.get(field).asText();
            return (value == null || value.isEmpty() || value.equals("null")) ? defaultValue : value;
        }
        return defaultValue;
    }

    private List<String> getStringList(JsonNode node, String field) {
        List<String> list = new ArrayList<>();
        if (node.has(field) && node.get(field).isArray()) {
            for (JsonNode item : node.get(field)) {
                String value = item.asText();
                if (value != null && !value.isEmpty() && !value.equals("null")) {
                    list.add(value);
                }
            }
        }
        return list;
    }

    private int calculateMatchScore(ResumeDTO resume, List<String> requiredSkills) {
        if (resume.getSkills() == null || resume.getSkills().isEmpty() || requiredSkills.isEmpty()) {
            return 0;
        }
        
        Set<String> userSkills = new HashSet<>();
        for (String skill : resume.getSkills()) {
            userSkills.add(skill.toLowerCase().trim());
        }
        
        int matches = 0;
        for (String required : requiredSkills) {
            String requiredLower = required.toLowerCase().trim();
            for (String userSkill : userSkills) {
                if (userSkill.contains(requiredLower) || requiredLower.contains(userSkill)) {
                    matches++;
                    break;
                }
            }
        }
        
        return (int) ((matches * 100.0) / requiredSkills.size());
    }
}

