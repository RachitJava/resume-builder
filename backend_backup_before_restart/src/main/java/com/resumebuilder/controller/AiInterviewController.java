package com.resumebuilder.controller;

import com.resumebuilder.service.AiInterviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/interview")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class AiInterviewController {

    @Autowired
    private AiInterviewService aiInterviewService;

    @PostMapping
    public ResponseEntity<?> conductInterview(@RequestBody Map<String, Object> request) {
        try {
            Map<String, Object> response = aiInterviewService.generateInterviewResponse(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/feedback")
    public ResponseEntity<?> generateFeedback(@RequestBody Map<String, Object> request) {
        try {
            Map<String, Object> feedback = aiInterviewService.generateFeedback(request);
            return ResponseEntity.ok(feedback);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
