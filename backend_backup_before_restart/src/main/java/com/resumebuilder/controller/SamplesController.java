package com.resumebuilder.controller;

import com.resumebuilder.dto.ResumeDTO;
import com.resumebuilder.service.ProfessionalSamplesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/samples")
@RequiredArgsConstructor
public class SamplesController {

    private final ProfessionalSamplesService samplesService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllSamples() {
        return ResponseEntity.ok(samplesService.getAllProfessionalSamples());
    }

    @GetMapping("/{professionId}")
    public ResponseEntity<ResumeDTO> getSampleByProfession(@PathVariable String professionId) {
        return ResponseEntity.ok(samplesService.getSampleByProfession(professionId));
    }
}

