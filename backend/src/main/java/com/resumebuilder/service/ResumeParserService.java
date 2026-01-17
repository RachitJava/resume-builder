package com.resumebuilder.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumebuilder.dto.ResumeDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ResumeParserService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    @Value("${ai.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String aiApiUrl;
    
    @Value("${ai.api.key:}")
    private String aiApiKey;
    
    @Value("${ai.api.model:llama-3.1-70b-versatile}")
    private String aiModel;

    public ResumeParserService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
            .build();
        this.objectMapper = objectMapper;
    }

    public ResumeDTO parseResume(MultipartFile file) {
        String content;
        String filename = file.getOriginalFilename();
        
        try {
            if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
                content = parsePdf(file.getInputStream());
            } else if (filename != null && (filename.toLowerCase().endsWith(".docx") || filename.toLowerCase().endsWith(".doc"))) {
                content = parseDocx(file.getInputStream());
            } else {
                throw new RuntimeException("Unsupported file format. Please upload PDF or DOCX.");
            }
            
            log.info("Parsed content length: {} characters", content.length());
            log.info("Resume content preview: {}", content.substring(0, Math.min(500, content.length())));
            
        } catch (Exception e) {
            log.error("Error parsing resume file: {}", e.getMessage());
            throw new RuntimeException("Failed to parse resume: " + e.getMessage());
        }

        // Try AI parsing first
        if (aiApiKey != null && !aiApiKey.isEmpty()) {
            try {
                log.info("Using AI to parse resume with model: {}", aiModel);
                return parseWithAI(content);
            } catch (Exception e) {
                log.error("AI parsing failed: {}", e.getMessage());
            }
        } else {
            log.warn("No AI API key configured, using regex fallback");
        }
        
        return parseWithRegex(content);
    }

    private String parsePdf(InputStream inputStream) throws Exception {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    private String parseDocx(InputStream inputStream) throws Exception {
        StringBuilder text = new StringBuilder();
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            for (XWPFParagraph para : document.getParagraphs()) {
                String paraText = para.getText();
                if (paraText != null && !paraText.trim().isEmpty()) {
                    text.append(paraText).append("\n");
                }
            }
        }
        return text.toString();
    }

    private ResumeDTO parseWithAI(String resumeText) {
        // Truncate if too long (Groq has token limits)
        String truncatedText = resumeText.length() > 6000 ? resumeText.substring(0, 6000) : resumeText;
        
        String systemPrompt = "You are a professional resume parser. Extract all information from resumes accurately and return valid JSON only. No markdown, no explanations.";
        
        String userPrompt = """
            Parse this resume and return a JSON object with these fields:
            - fullName (string)
            - email (string)
            - phone (string)
            - location (string)
            - linkedIn (string)
            - github (string)
            - website (string)
            - summary (string - professional summary)
            - skills (array of strings - ALL skills found)
            - experience (array of objects - see structure below)
            - education (array of objects with: institution, degree, field, startDate, endDate, gpa)
            - certifications (array of strings)
            - projects (array of objects with: name, description, technologies as array)
            
            IMPORTANT - Experience Structure:
            For each job, determine if it's a SERVICE-BASED company (consulting firms like TCS, Cognizant, Infosys, Wipro, Accenture, Capgemini, HCL, Tech Mahindra, Deloitte, IBM Consulting, etc.) where the person worked on CLIENT PROJECTS.
            
            Experience object structure:
            {
                "company": "Company Name",
                "position": "Job Title",
                "location": "Location",
                "startDate": "Start date",
                "endDate": "End date or Present",
                "serviceBased": true/false (true if consulting/service company with client work),
                "highlights": ["Achievement 1", "Achievement 2"] (for product companies),
                "clientProjects": [  (ONLY for service-based companies)
                    {
                        "clientName": "Client company name (e.g., Verizon, Bank of America)",
                        "projectName": "Project name if mentioned",
                        "role": "Role at client",
                        "startDate": "Start date at client",
                        "endDate": "End date at client",
                        "highlights": ["Achievement 1", "Achievement 2"]
                    }
                ]
            }
            
            DETECTION TIPS for service-based:
            - Look for keywords: "client", "customer", "engagement", "project for", "worked with", "deployed at"
            - Multiple company names under one employer = service-based with clients
            - If resume mentions working "for" or "with" another company while employed somewhere = client project
            - Common service companies: TCS, Tata Consultancy, Cognizant, Infosys, Wipro, Accenture, Capgemini, HCL, Tech Mahindra, Deloitte, KPMG, PwC, EY, IBM Global Services, DXC, LTIMindtree, Mphasis, etc.
            
            Return ONLY the JSON object, nothing else.
            
            Resume:
            \"\"\"
            """ + truncatedText + "\n\"\"\"";

        try {
            // Build request body
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", aiModel);
            
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", userPrompt));
            requestBody.put("messages", messages);
            
            requestBody.put("temperature", 0.1);
            requestBody.put("max_tokens", 4096);
            
            String requestJson = objectMapper.writeValueAsString(requestBody);
            log.debug("AI Request: {}", requestJson.substring(0, Math.min(500, requestJson.length())));

            String response = webClient.post()
                .uri(aiApiUrl)
                .header("Authorization", "Bearer " + aiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestJson)
                .retrieve()
                .onStatus(status -> status.isError(), clientResponse -> {
                    return clientResponse.bodyToMono(String.class)
                        .flatMap(body -> {
                            log.error("API Error Response: {}", body);
                            return Mono.error(new RuntimeException("API Error: " + body));
                        });
                })
                .bodyToMono(String.class)
                .block();

            log.info("AI Response received, length: {}", response != null ? response.length() : 0);
            
            // Parse the response
            JsonNode responseJson = objectMapper.readTree(response);
            String content = responseJson
                .path("choices")
                .path(0)
                .path("message")
                .path("content")
                .asText();
            
            log.info("AI extracted content: {}", content.substring(0, Math.min(300, content.length())));
            
            // Clean up the JSON
            content = cleanJsonResponse(content);
            
            return convertJsonToResumeDTO(content);
            
        } catch (WebClientResponseException e) {
            log.error("API call failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI API error: " + e.getMessage());
        } catch (Exception e) {
            log.error("AI parsing error: {}", e.getMessage(), e);
            throw new RuntimeException("AI parsing failed: " + e.getMessage());
        }
    }
    
    private String cleanJsonResponse(String content) {
        content = content.trim();
        
        // Remove markdown code blocks
        if (content.startsWith("```json")) {
            content = content.substring(7);
        } else if (content.startsWith("```")) {
            content = content.substring(3);
        }
        if (content.endsWith("```")) {
            content = content.substring(0, content.length() - 3);
        }
        
        // Find JSON object boundaries
        int startIdx = content.indexOf('{');
        int endIdx = content.lastIndexOf('}');
        if (startIdx >= 0 && endIdx > startIdx) {
            content = content.substring(startIdx, endIdx + 1);
        }
        
        return content.trim();
    }

    private ResumeDTO convertJsonToResumeDTO(String jsonContent) throws Exception {
        log.debug("Converting JSON to DTO: {}", jsonContent);
        
        JsonNode json = objectMapper.readTree(jsonContent);
        ResumeDTO resume = new ResumeDTO();
        
        resume.setFullName(getTextOrNull(json, "fullName"));
        resume.setEmail(getTextOrNull(json, "email"));
        resume.setPhone(getTextOrNull(json, "phone"));
        resume.setLocation(getTextOrNull(json, "location"));
        resume.setLinkedIn(getTextOrNull(json, "linkedIn"));
        resume.setGithub(getTextOrNull(json, "github"));
        resume.setWebsite(getTextOrNull(json, "website"));
        resume.setSummary(getTextOrNull(json, "summary"));
        
        // Skills
        if (json.has("skills") && json.get("skills").isArray()) {
            List<String> skills = new ArrayList<>();
            for (JsonNode skill : json.get("skills")) {
                String s = skill.asText();
                if (s != null && !s.isEmpty() && !s.equals("null")) {
                    skills.add(s);
                }
            }
            resume.setSkills(skills);
            log.info("Extracted {} skills", skills.size());
        }
        
        // Experience
        if (json.has("experience") && json.get("experience").isArray()) {
            List<ResumeDTO.Experience> experiences = new ArrayList<>();
            for (JsonNode exp : json.get("experience")) {
                ResumeDTO.Experience experience = new ResumeDTO.Experience();
                experience.setCompany(getTextOrNull(exp, "company"));
                experience.setPosition(getTextOrNull(exp, "position"));
                experience.setLocation(getTextOrNull(exp, "location"));
                experience.setStartDate(getTextOrNull(exp, "startDate"));
                experience.setEndDate(getTextOrNull(exp, "endDate"));
                
                // Check if service-based company
                if (exp.has("serviceBased")) {
                    experience.setServiceBased(exp.get("serviceBased").asBoolean(false));
                }
                
                // Parse client projects for service-based companies
                if (exp.has("clientProjects") && exp.get("clientProjects").isArray()) {
                    List<ResumeDTO.ClientProject> clientProjects = new ArrayList<>();
                    for (JsonNode clientNode : exp.get("clientProjects")) {
                        ResumeDTO.ClientProject client = new ResumeDTO.ClientProject();
                        client.setClientName(getTextOrNull(clientNode, "clientName"));
                        client.setProjectName(getTextOrNull(clientNode, "projectName"));
                        client.setRole(getTextOrNull(clientNode, "role"));
                        client.setStartDate(getTextOrNull(clientNode, "startDate"));
                        client.setEndDate(getTextOrNull(clientNode, "endDate"));
                        client.setDescription(getTextOrNull(clientNode, "description"));
                        
                        if (clientNode.has("highlights") && clientNode.get("highlights").isArray()) {
                            List<String> clientHighlights = new ArrayList<>();
                            for (JsonNode h : clientNode.get("highlights")) {
                                String highlight = h.asText();
                                if (highlight != null && !highlight.isEmpty() && !highlight.equals("null")) {
                                    clientHighlights.add(highlight);
                                }
                            }
                            client.setHighlights(clientHighlights);
                        }
                        
                        if (client.getClientName() != null) {
                            clientProjects.add(client);
                        }
                    }
                    experience.setClientProjects(clientProjects);
                    
                    // Auto-set serviceBased if client projects exist
                    if (!clientProjects.isEmpty()) {
                        experience.setServiceBased(true);
                    }
                    
                    log.info("Extracted {} client projects for {}", clientProjects.size(), experience.getCompany());
                }
                
                // Parse highlights for product-based companies
                if (exp.has("highlights") && exp.get("highlights").isArray()) {
                    List<String> highlights = new ArrayList<>();
                    for (JsonNode h : exp.get("highlights")) {
                        String highlight = h.asText();
                        if (highlight != null && !highlight.isEmpty() && !highlight.equals("null")) {
                            highlights.add(highlight);
                        }
                    }
                    experience.setHighlights(highlights);
                }
                
                // Also check for description field
                if (exp.has("description")) {
                    String desc = getTextOrNull(exp, "description");
                    if (desc != null && (experience.getHighlights() == null || experience.getHighlights().isEmpty())) {
                        experience.setHighlights(List.of(desc));
                    }
                }
                
                if (experience.getCompany() != null || experience.getPosition() != null) {
                    experiences.add(experience);
                }
            }
            resume.setExperience(experiences);
            log.info("Extracted {} experiences", experiences.size());
        }
        
        // Education
        if (json.has("education") && json.get("education").isArray()) {
            List<ResumeDTO.Education> educationList = new ArrayList<>();
            for (JsonNode edu : json.get("education")) {
                ResumeDTO.Education education = new ResumeDTO.Education();
                education.setInstitution(getTextOrNull(edu, "institution"));
                education.setDegree(getTextOrNull(edu, "degree"));
                education.setField(getTextOrNull(edu, "field"));
                education.setStartDate(getTextOrNull(edu, "startDate"));
                education.setEndDate(getTextOrNull(edu, "endDate"));
                education.setGpa(getTextOrNull(edu, "gpa"));
                
                if (education.getInstitution() != null || education.getDegree() != null) {
                    educationList.add(education);
                }
            }
            resume.setEducation(educationList);
            log.info("Extracted {} education entries", educationList.size());
        }
        
        // Certifications
        if (json.has("certifications") && json.get("certifications").isArray()) {
            List<String> certs = new ArrayList<>();
            for (JsonNode cert : json.get("certifications")) {
                String c = cert.asText();
                if (c != null && !c.isEmpty() && !c.equals("null")) {
                    certs.add(c);
                }
            }
            resume.setCertifications(certs);
            log.info("Extracted {} certifications", certs.size());
        }
        
        // Projects
        if (json.has("projects") && json.get("projects").isArray()) {
            List<ResumeDTO.Project> projects = new ArrayList<>();
            for (JsonNode proj : json.get("projects")) {
                ResumeDTO.Project project = new ResumeDTO.Project();
                project.setName(getTextOrNull(proj, "name"));
                project.setDescription(getTextOrNull(proj, "description"));
                
                if (proj.has("technologies") && proj.get("technologies").isArray()) {
                    List<String> techs = new ArrayList<>();
                    for (JsonNode t : proj.get("technologies")) {
                        String tech = t.asText();
                        if (tech != null && !tech.isEmpty() && !tech.equals("null")) {
                            techs.add(tech);
                        }
                    }
                    project.setTechnologies(techs);
                }
                
                if (project.getName() != null) {
                    projects.add(project);
                }
            }
            resume.setProjects(projects);
            log.info("Extracted {} projects", projects.size());
        }
        
        resume.setTemplate("modern");
        
        log.info("Final extracted resume: name={}, email={}, skills={}, exp={}, edu={}, projects={}",
            resume.getFullName(), resume.getEmail(),
            resume.getSkills() != null ? resume.getSkills().size() : 0,
            resume.getExperience() != null ? resume.getExperience().size() : 0,
            resume.getEducation() != null ? resume.getEducation().size() : 0,
            resume.getProjects() != null ? resume.getProjects().size() : 0);
        
        return resume;
    }
    
    private String getTextOrNull(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            String value = node.get(field).asText();
            return (value == null || value.isEmpty() || value.equals("null")) ? null : value;
        }
        return null;
    }

    // Fallback regex-based parsing
    private ResumeDTO parseWithRegex(String content) {
        log.info("Using regex fallback for parsing");
        ResumeDTO resume = new ResumeDTO();
        String[] lines = content.split("\n");
        
        List<String> cleanLines = Arrays.stream(lines)
            .map(String::trim)
            .filter(line -> !line.isEmpty())
            .collect(Collectors.toList());
        
        extractContactInfo(resume, content, cleanLines);
        resume.setSkills(extractSkillsFromFullText(content));
        extractSummary(resume, cleanLines);
        
        resume.setTemplate("modern");
        return resume;
    }

    private void extractContactInfo(ResumeDTO resume, String content, List<String> lines) {
        // Email
        Pattern emailPattern = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}");
        Matcher emailMatcher = emailPattern.matcher(content);
        if (emailMatcher.find()) {
            resume.setEmail(emailMatcher.group());
        }

        // Phone
        Pattern phonePattern = Pattern.compile("\\+?\\d{1,3}[\\s.-]?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}|\\d{10,12}");
        Matcher phoneMatcher = phonePattern.matcher(content);
        if (phoneMatcher.find()) {
            resume.setPhone(phoneMatcher.group().trim());
        }

        // LinkedIn
        Pattern linkedInPattern = Pattern.compile("linkedin\\.com/in/([a-zA-Z0-9-]+)", Pattern.CASE_INSENSITIVE);
        Matcher linkedInMatcher = linkedInPattern.matcher(content);
        if (linkedInMatcher.find()) {
            resume.setLinkedIn("linkedin.com/in/" + linkedInMatcher.group(1));
        }

        // GitHub
        Pattern githubPattern = Pattern.compile("github\\.com/([a-zA-Z0-9-]+)", Pattern.CASE_INSENSITIVE);
        Matcher githubMatcher = githubPattern.matcher(content);
        if (githubMatcher.find()) {
            resume.setGithub("github.com/" + githubMatcher.group(1));
        }

        // Name
        for (int i = 0; i < Math.min(5, lines.size()); i++) {
            String line = lines.get(i);
            if (!line.contains("@") && !line.matches(".*\\d{5,}.*") && 
                line.length() > 2 && line.length() < 50 &&
                line.matches("[A-Za-z\\s.'-]+")) {
                resume.setFullName(line);
                break;
            }
        }
    }

    private void extractSummary(ResumeDTO resume, List<String> lines) {
        StringBuilder summary = new StringBuilder();
        boolean foundSummarySection = false;
        
        for (String line : lines) {
            String lower = line.toLowerCase();
            if (lower.matches(".*\\b(summary|objective|about|profile)\\b.*") && line.length() < 30) {
                foundSummarySection = true;
                continue;
            }
            if (foundSummarySection) {
                if (line.length() > 50 && line.length() < 500) {
                    summary.append(line).append(" ");
                    if (summary.length() > 200) break;
                }
                if (lower.matches(".*\\b(experience|education|skills)\\b.*") && line.length() < 30) {
                    break;
                }
            }
        }
        
        if (summary.length() > 0) {
            resume.setSummary(summary.toString().trim());
        }
    }

    private List<String> extractSkillsFromFullText(String content) {
        List<String> commonSkills = List.of(
            "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
            "React", "Angular", "Vue.js", "Node.js", "Express", "Django", "Flask", "Spring Boot", "Spring", ".NET",
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Git", "GitHub", "Terraform",
            "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "DynamoDB",
            "HTML", "CSS", "SASS", "Tailwind", "Bootstrap",
            "REST", "GraphQL", "Microservices", "API", "CI/CD", "DevOps",
            "Agile", "Scrum", "JIRA",
            "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
            "Excel", "Tableau", "Power BI",
            "Linux", "Bash"
        );
        
        List<String> foundSkills = new ArrayList<>();
        String contentLower = content.toLowerCase();
        
        for (String skill : commonSkills) {
            if (Pattern.compile("\\b" + Pattern.quote(skill.toLowerCase()) + "\\b", Pattern.CASE_INSENSITIVE).matcher(contentLower).find()) {
                foundSkills.add(skill);
            }
        }
        
        return foundSkills.stream().distinct().limit(25).collect(Collectors.toList());
    }
}
