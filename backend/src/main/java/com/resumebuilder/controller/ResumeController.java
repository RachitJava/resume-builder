package com.resumebuilder.controller;

import com.resumebuilder.dto.ResumeDTO;
import com.resumebuilder.entity.User;
import com.resumebuilder.service.AuthService;
import com.resumebuilder.service.PdfService;
import com.resumebuilder.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final PdfService pdfService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody ResumeDTO dto) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(resumeService.create(dto, user.getEmail()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id, 
            @Valid @RequestBody ResumeDTO dto) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(resumeService.update(id, dto, user.getEmail()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(resumeService.getById(id, user.getEmail()));
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(resumeService.getAllByUser(user.getEmail()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        resumeService.delete(id, user.getEmail());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> exportPdf(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestParam(required = false) String template) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        
        byte[] pdf = pdfService.generatePdf(id, template, user.getEmail());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "resume.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }

    private User getAuthenticatedUser(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return authService.validateToken(token);
        }
        return null;
    }
}

