package com.resumebuilder.controller;

import com.resumebuilder.dto.ResumeDTO;
import com.resumebuilder.service.ResumeParserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final ResumeParserService parserService;

    @PostMapping("/parse")
    public ResponseEntity<?> parseResume(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload a file"));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.toLowerCase().endsWith(".pdf") && 
                                  !filename.toLowerCase().endsWith(".docx") &&
                                  !filename.toLowerCase().endsWith(".doc"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF and DOCX files are supported"));
        }

        try {
            ResumeDTO parsedResume = parserService.parseResume(file);
            return ResponseEntity.ok(parsedResume);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

