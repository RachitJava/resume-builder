package com.resumebuilder.controller;

import com.resumebuilder.dto.JobMatchDTO;
import com.resumebuilder.service.JobMatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/job-match")
@RequiredArgsConstructor
public class JobMatchController {

    private final JobMatchService jobMatchService;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeJob(@RequestBody JobMatchDTO.JobAnalysisRequest request) {
        if (request.getJobDescription() == null || request.getJobDescription().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Job description is required"));
        }

        try {
            JobMatchDTO.JobAnalysisResponse response = jobMatchService.analyzeAndCreateResume(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

