package com.resumebuilder.controller;

import com.resumebuilder.dto.AiDTO;
import com.resumebuilder.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/analyze")
    public ResponseEntity<AiDTO.ChatResponse> analyzeJobDescription(@RequestBody AiDTO.ChatRequest request) {
        return ResponseEntity.ok(aiService.processJobDescription(request));
    }
}

