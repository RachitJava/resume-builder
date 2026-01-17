package com.resumebuilder.controller;

import com.resumebuilder.dto.ResumeDTO;
import com.resumebuilder.service.PdfService;
import com.resumebuilder.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final PdfService pdfService;

    @PostMapping
    public ResponseEntity<ResumeDTO> create(@Valid @RequestBody ResumeDTO dto) {
        return ResponseEntity.ok(resumeService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResumeDTO> update(@PathVariable String id, @Valid @RequestBody ResumeDTO dto) {
        return ResponseEntity.ok(resumeService.update(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResumeDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(resumeService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ResumeDTO>> getAll() {
        return ResponseEntity.ok(resumeService.getAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        resumeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable String id,
            @RequestParam(required = false) String template) {
        
        byte[] pdf = pdfService.generatePdf(id, template);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "resume.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
}

