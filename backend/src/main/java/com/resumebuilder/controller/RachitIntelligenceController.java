package com.resumebuilder.controller;

import com.resumebuilder.entity.QuestionBank;
import com.resumebuilder.repository.QuestionBankRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Controller for managing Rachit Intelligence system
 * Handles data synchronization from database tables to AI system
 */
@RestController
@RequestMapping("/api/admin/rachit-intelligence")
@CrossOrigin(origins = "*")
public class RachitIntelligenceController {

    @Autowired
    private QuestionBankRepository questionBankRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${rachit.intelligence.api.url:http://localhost:8000}")
    private String intelligenceApiUrl;

    /**
     * Get dashboard statistics
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Question Bank stats
        long totalQuestionBanks = questionBankRepository.count();
        List<QuestionBank> allBanks = questionBankRepository.findAll();

        int totalQuestions = 0;
        for (QuestionBank bank : allBanks) {
            if (bank.getQuestions() != null) {
                // Count questions in JSON array
                totalQuestions += bank.getQuestions().split("\\{").length - 1;
            }
        }

        stats.put("totalQuestionBanks", totalQuestionBanks);
        stats.put("totalQuestions", totalQuestions);
        stats.put("systemStatus", "active");
        stats.put("lastSync", LocalDateTime.now());
        stats.put("apiUrl", intelligenceApiUrl);

        return ResponseEntity.ok(stats);
    }

    /**
     * Sync all question banks to Rachit Intelligence
     */
    @PostMapping("/sync/question-banks")
    public ResponseEntity<Map<String, Object>> syncQuestionBanks() {
        try {
            // Fetch all question banks from database
            List<QuestionBank> questionBanks = questionBankRepository.findAll();

            // Prepare data for AI system
            Map<String, Object> syncData = new HashMap<>();
            syncData.put("source", "question_banks");
            syncData.put("timestamp", LocalDateTime.now().toString());
            syncData.put("totalBanks", questionBanks.size());

            List<Map<String, Object>> banksData = new ArrayList<>();
            for (QuestionBank bank : questionBanks) {
                Map<String, Object> bankData = new HashMap<>();
                bankData.put("id", bank.getId());
                bankData.put("name", bank.getName());
                bankData.put("category", bank.getCategory());
                bankData.put("questions", bank.getQuestions());
                bankData.put("createdAt", bank.getCreatedAt());
                banksData.add(bankData);
            }
            syncData.put("banks", banksData);

            // Send to Rachit Intelligence API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(syncData, headers);

            try {
                ResponseEntity<Map> response = restTemplate.exchange(
                        intelligenceApiUrl + "/api/v1/admin/sync-data",
                        HttpMethod.POST,
                        entity,
                        Map.class);

                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message",
                        "Successfully synced " + questionBanks.size() + " question banks to Rachit Intelligence");
                result.put("syncedBanks", questionBanks.size());
                result.put("timestamp", LocalDateTime.now());
                result.put("apiResponse", response.getBody());

                return ResponseEntity.ok(result);

            } catch (Exception apiError) {
                // API not available, but we can still return the data
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Rachit Intelligence API not available: " + apiError.getMessage());
                result.put("preparedData", syncData);
                result.put("note",
                        "Data prepared but not synced. Please ensure API is running at: " + intelligenceApiUrl);

                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(result);
            }

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get specific question bank details for training
     */
    @GetMapping("/training/question-bank/{id}")
    public ResponseEntity<Map<String, Object>> getQuestionBankForTraining(@PathVariable String id) {
        Optional<QuestionBank> bankOpt = questionBankRepository.findById(id);

        if (!bankOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        QuestionBank bank = bankOpt.get();
        Map<String, Object> trainingData = new HashMap<>();
        trainingData.put("id", bank.getId());
        trainingData.put("name", bank.getName());
        trainingData.put("category", bank.getCategory());
        trainingData.put("questions", bank.getQuestions());
        trainingData.put("totalQuestions",
                bank.getQuestions() != null ? bank.getQuestions().split("\\{").length - 1 : 0);
        trainingData.put("createdAt", bank.getCreatedAt());

        return ResponseEntity.ok(trainingData);
    }

    /**
     * Sync specific category questions
     */
    @PostMapping("/sync/category/{category}")
    public ResponseEntity<Map<String, Object>> syncByCategory(@PathVariable String category) {
        try {
            List<QuestionBank> categoryBanks = questionBankRepository.findByCategory(category);

            if (categoryBanks.isEmpty()) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "No question banks found for category: " + category);
                return ResponseEntity.ok(result);
            }

            // Prepare category-specific sync data
            Map<String, Object> syncData = new HashMap<>();
            syncData.put("source", "category_sync");
            syncData.put("category", category);
            syncData.put("timestamp", LocalDateTime.now().toString());
            syncData.put("totalBanks", categoryBanks.size());

            List<Map<String, Object>> banksData = new ArrayList<>();
            for (QuestionBank bank : categoryBanks) {
                Map<String, Object> bankData = new HashMap<>();
                bankData.put("id", bank.getId());
                bankData.put("name", bank.getName());
                bankData.put("category", bank.getCategory());
                bankData.put("questions", bank.getQuestions());
                banksData.add(bankData);
            }
            syncData.put("banks", banksData);

            // Send to Rachit Intelligence API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(syncData, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    intelligenceApiUrl + "/api/v1/admin/sync-data",
                    HttpMethod.POST,
                    entity,
                    Map.class);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Successfully synced category: " + category);
            result.put("syncedBanks", categoryBanks.size());
            result.put("timestamp", LocalDateTime.now());
            result.put("apiResponse", response.getBody());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get available database tables for Rachit Intelligence
     */
    @GetMapping("/database/tables")
    public ResponseEntity<Map<String, Object>> getAvailableTables() {
        Map<String, Object> tables = new HashMap<>();

        // List of tables that can feed data to Rachit Intelligence
        List<Map<String, String>> availableTables = new ArrayList<>();

        availableTables.add(Map.of(
                "name", "question_banks",
                "description", "Interview question banks with categorized questions",
                "status", "active",
                "recordCount", String.valueOf(questionBankRepository.count())));

        // You can add more tables as needed
        // availableTables.add(Map.of(
        // "name", "interview_history",
        // "description", "Historical interview data for training",
        // "status", "planned"
        // ));

        tables.put("tables", availableTables);
        tables.put("totalTables", availableTables.size());
        tables.put("intelligenceApiUrl", intelligenceApiUrl);

        return ResponseEntity.ok(tables);
    }

    /**
     * Test connection to Rachit Intelligence API
     */
    @GetMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> result = new HashMap<>();

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    intelligenceApiUrl + "/health",
                    Map.class);

            result.put("connected", true);
            result.put("apiUrl", intelligenceApiUrl);
            result.put("status", response.getBody());
            result.put("message", "Successfully connected to Rachit Intelligence API");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("connected", false);
            result.put("apiUrl", intelligenceApiUrl);
            result.put("error", e.getMessage());
            result.put("message", "Failed to connect to Rachit Intelligence API. Please ensure the API is running.");

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(result);
        }
    }
}
