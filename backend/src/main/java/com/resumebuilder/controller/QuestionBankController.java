package com.resumebuilder.controller;

import com.resumebuilder.entity.QuestionBank;
import com.resumebuilder.entity.User;
import com.resumebuilder.service.QuestionBankService;
import com.resumebuilder.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/question-banks")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class QuestionBankController {

    @Autowired
    private QuestionBankService questionBankService;

    @Autowired
    private AuthService authService;

    @GetMapping
    public ResponseEntity<?> getUserQuestionBanks(@RequestHeader("Authorization") String authHeader) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        System.out.println("DEBUG: Fetching banks for " + user.getEmail() + " (Admin: " + user.isAdmin() + ")");

        if (user.isAdmin()) {
            List<QuestionBank> allBanks = questionBankService.getAllQuestionBanks();
            System.out.println("DEBUG: Admin found " + allBanks.size() + " banks.");
            return ResponseEntity.ok(allBanks);
        }

        List<QuestionBank> banks = questionBankService.getUserQuestionBanks(user);
        System.out.println("DEBUG: User found " + banks.size() + " banks.");
        return ResponseEntity.ok(banks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuestionBank(@PathVariable String id,
            @RequestHeader("Authorization") String authHeader) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        QuestionBank bank = questionBankService.getQuestionBank(id, user);
        if (bank == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Question bank not found"));
        }

        return ResponseEntity.ok(bank);
    }

    @PostMapping
    public ResponseEntity<?> createQuestionBank(@RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String authHeader) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            QuestionBank bank = questionBankService.createQuestionBank(request, user);
            return ResponseEntity.ok(bank);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadQuestionFile(@RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam("category") String category,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPublic", required = false) Boolean isPublic,
            @RequestParam(value = "isAnonymous", required = false) Boolean isAnonymous,
            @RequestHeader("Authorization") String authHeader) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            QuestionBank bank = questionBankService.createFromFile(file, name, category, description, isPublic,
                    isAnonymous, user);
            return ResponseEntity.ok(bank);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuestionBank(@PathVariable String id, @RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String authHeader) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            QuestionBank bank = questionBankService.updateQuestionBank(id, request, user);
            if (bank == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Question bank not found"));
            }
            return ResponseEntity.ok(bank);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuestionBank(@PathVariable String id,
            @RequestHeader("Authorization") String authHeader) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        boolean deleted = questionBankService.deleteQuestionBank(id, user);
        if (!deleted) {
            return ResponseEntity.status(404).body(Map.of("error", "Question bank not found"));
        }

        return ResponseEntity.ok(Map.of("message", "Question bank deleted successfully"));
    }

    @PostMapping("/{id}/increment-usage")
    public ResponseEntity<?> incrementUsage(@PathVariable String id) {
        // No auth required for incrementing usage during interview
        questionBankService.incrementUsage(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/log-interview")
    public ResponseEntity<?> logInterview(@RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String authHeader) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Object bankIdsObj = request.get("bankIds");
        List<String> bankIds = new ArrayList<>();
        if (bankIdsObj instanceof List<?>) {
            for (Object item : (List<?>) bankIdsObj) {
                if (item instanceof String) {
                    bankIds.add((String) item);
                }
            }
        }

        String meetingId = (String) request.get("meetingId");
        String candidateName = (String) request.get("candidateName");
        String candidateRole = (String) request.get("candidateRole");
        String candidateExperience = (String) request.get("candidateExperience");

        questionBankService.logInterviewStart(user, bankIds, meetingId, candidateName, candidateRole,
                candidateExperience);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getInterviewHistory(@RequestHeader("Authorization") String authHeader) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null || !user.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        return ResponseEntity.ok(questionBankService.getAllInterviewRecords());
    }
}
