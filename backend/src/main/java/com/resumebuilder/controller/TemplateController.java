package com.resumebuilder.controller;

import com.resumebuilder.dto.ResumeDTO;
import com.resumebuilder.service.SampleDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final SampleDataService sampleDataService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllTemplates() {
        return ResponseEntity.ok(sampleDataService.getTemplates());
    }

    @GetMapping("/countries")
    public ResponseEntity<Map<String, String>> getCountries() {
        return ResponseEntity.ok(sampleDataService.getCountryInfo());
    }

    @GetMapping("/{templateId}/sample")
    public ResponseEntity<ResumeDTO> getSampleResume(@PathVariable String templateId) {
        return ResponseEntity.ok(sampleDataService.getSampleForTemplate(templateId));
    }
}

