package com.resumebuilder.controller;

import com.resumebuilder.dto.ResumeDTO;
import com.resumebuilder.entity.Template;
import com.resumebuilder.repository.TemplateRepository;
import com.resumebuilder.service.SampleDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TemplateController {

    private final SampleDataService sampleDataService;
    private final TemplateRepository templateRepository;

    @GetMapping
    public ResponseEntity<List<Template>> getAllTemplates() {
        return ResponseEntity.ok(templateRepository.findAll());
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
