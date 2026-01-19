package com.resumebuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumebuilder.entity.QuestionBank;
import com.resumebuilder.entity.User;
import com.resumebuilder.repository.QuestionBankRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;

import java.io.InputStream;
import java.util.*;

@Service
public class QuestionBankService {

    @Autowired
    private QuestionBankRepository questionBankRepository;

    @Autowired
    private ResumeParserService resumeParserService;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ai.api.url}")
    private String aiApiUrl;

    @Value("${ai.api.key}")
    private String aiApiKey;

    @Value("${ai.api.model}")
    private String aiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<QuestionBank> getUserQuestionBanks(User user) {
        return questionBankRepository.findByUserAndIsActiveTrueOrderByCreatedAtDesc(user);
    }

    public QuestionBank getQuestionBank(String id, User user) {
        Optional<QuestionBank> bank = questionBankRepository.findById(id);
        if (bank.isPresent() && bank.get().getUser().getId().equals(user.getId())) {
            return bank.get();
        }
        return null;
    }

    public QuestionBank createQuestionBank(Map<String, Object> request, User user) {
        try {
            QuestionBank bank = new QuestionBank();
            bank.setUser(user);
            bank.setName((String) request.get("name"));
            bank.setCategory((String) request.get("category"));
            bank.setDescription((String) request.getOrDefault("description", ""));

            // Convert questions list to JSON string
            Object questionsObj = request.get("questions");
            String questionsJson = objectMapper.writeValueAsString(questionsObj);
            bank.setQuestions(questionsJson);

            return questionBankRepository.save(bank);
        } catch (Exception e) {
            throw new RuntimeException("Error creating question bank: " + e.getMessage(), e);
        }
    }

    public QuestionBank createFromFile(MultipartFile file, String name, String category, String description,
            User user) {
        try {
            // Extract text from file based on type
            String fileContent = extractTextFromFile(file);

            // Use AI to parse questions and answers from the content
            String questionsJson = parseQuestionsWithAI(fileContent, category);

            QuestionBank bank = new QuestionBank();
            bank.setUser(user);
            bank.setName(name);
            bank.setCategory(category);
            bank.setDescription(description != null ? description : "Imported from " + file.getOriginalFilename());
            bank.setQuestions(questionsJson);

            return questionBankRepository.save(bank);
        } catch (Exception e) {
            throw new RuntimeException("Error creating question bank from file: " + e.getMessage(), e);
        }
    }

    private String extractTextFromFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new RuntimeException("Invalid file");
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();

        switch (extension) {
            case "pdf":
                return extractFromPdf(file.getInputStream());
            case "doc":
            case "docx":
                return extractFromDocx(file.getInputStream());
            case "txt":
                return new String(file.getBytes());
            default:
                throw new RuntimeException("Unsupported file type: " + extension);
        }
    }

    private String extractFromPdf(InputStream inputStream) throws Exception {
        try (PDDocument document = PDDocument.load(inputStream)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String extractFromDocx(InputStream inputStream) throws Exception {
        XWPFDocument document = new XWPFDocument(inputStream);
        XWPFWordExtractor extractor = new XWPFWordExtractor(document);
        String text = extractor.getText();
        extractor.close();
        document.close();
        return text;
    }

    public QuestionBank updateQuestionBank(String id, Map<String, Object> request, User user) {
        try {
            QuestionBank bank = getQuestionBank(id, user);
            if (bank == null) {
                return null;
            }

            if (request.containsKey("name")) {
                bank.setName((String) request.get("name"));
            }
            if (request.containsKey("category")) {
                bank.setCategory((String) request.get("category"));
            }
            if (request.containsKey("description")) {
                bank.setDescription((String) request.get("description"));
            }
            if (request.containsKey("questions")) {
                String questionsJson = objectMapper.writeValueAsString(request.get("questions"));
                bank.setQuestions(questionsJson);
            }
            if (request.containsKey("isActive")) {
                bank.setActive((Boolean) request.get("isActive"));
            }

            return questionBankRepository.save(bank);
        } catch (Exception e) {
            throw new RuntimeException("Error updating question bank: " + e.getMessage(), e);
        }
    }

    public boolean deleteQuestionBank(String id, User user) {
        QuestionBank bank = getQuestionBank(id, user);
        if (bank == null) {
            return false;
        }

        // Soft delete
        bank.setActive(false);
        questionBankRepository.save(bank);
        return true;
    }

    private String parseQuestionsWithAI(String fileContent, String category) {
        try {
            String systemPrompt = "You are an expert at extracting and organizing interview questions and answers from text. "
                    +
                    "Your task is to parse the content, identify topics, and intelligently group related questions together. "
                    +
                    "Return ONLY a valid JSON array in this exact format:\n" +
                    "[{\"question\": \"...\", \"answer\": \"...\", \"difficulty\": \"easy|medium|hard\", \"tags\": [\"tag1\", \"tag2\"], \"topic\": \"topic_name\"}]\n\n"
                    +
                    "CRITICAL RULES:\n" +
                    "1. IDENTIFY TOPICS: Analyze the content and identify distinct topics/themes\n" +
                    "2. GROUP BY TOPIC: Group related questions together by topic\n" +
                    "3. SORT INTELLIGENTLY: Within each topic, arrange questions from easy to hard\n" +
                    "4. CONSISTENT TAGS: Use consistent tag names across similar questions (e.g., 'java', not 'Java' and 'JAVA')\n"
                    +
                    "5. TOPIC FIELD: Add a 'topic' field to each question (e.g., 'OOP Concepts', 'Data Structures', 'System Design')\n"
                    +
                    "6. EXTRACT Q&A PAIRS: Extract clear question-answer pairs\n" +
                    "7. INFER DIFFICULTY: Assign difficulty based on complexity (easy/medium/hard)\n" +
                    "8. HANDLE MISSING ANSWERS: If no answer is provided, use empty string \"\"\n" +
                    "9. ADD RELEVANT TAGS: Include 2-4 specific tags per question\n" +
                    "10. PROPER JSON: Return ONLY the JSON array, no markdown, no additional text\n" +
                    "11. ESCAPE PROPERLY: Ensure all JSON strings are properly escaped\n\n" +
                    "EXAMPLE OUTPUT:\n" +
                    "[\n" +
                    "  {\"question\": \"What is OOP?\", \"answer\": \"Object-Oriented Programming...\", \"difficulty\": \"easy\", \"tags\": [\"oop\", \"basics\"], \"topic\": \"OOP Fundamentals\"},\n"
                    +
                    "  {\"question\": \"Explain inheritance\", \"answer\": \"Inheritance allows...\", \"difficulty\": \"medium\", \"tags\": [\"oop\", \"inheritance\"], \"topic\": \"OOP Fundamentals\"},\n"
                    +
                    "  {\"question\": \"What is polymorphism?\", \"answer\": \"Polymorphism means...\", \"difficulty\": \"hard\", \"tags\": [\"oop\", \"polymorphism\"], \"topic\": \"OOP Fundamentals\"}\n"
                    +
                    "]";

            String userPrompt = "Category: " + category + "\n\nContent:\n" + fileContent;

            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + aiApiKey);

            Map<String, Object> requestBody = Map.of(
                    "model", aiModel,
                    "messages", messages,
                    "temperature", 0.3,
                    "max_tokens", 2000);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(aiApiUrl, HttpMethod.POST, entity, Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");

                    // Clean up the response to ensure it's valid JSON
                    content = content.trim();
                    if (content.startsWith("```json")) {
                        content = content.substring(7);
                    }
                    if (content.startsWith("```")) {
                        content = content.substring(3);
                    }
                    if (content.endsWith("```")) {
                        content = content.substring(0, content.length() - 3);
                    }
                    content = content.trim();

                    // Validate it's proper JSON
                    objectMapper.readValue(content, List.class);

                    return content;
                }
            }

            // Fallback: return empty array
            return "[]";

        } catch (Exception e) {
            throw new RuntimeException("AI parsing failed: " + e.getMessage(), e);
        }
    }
}
