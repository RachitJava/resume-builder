package com.resumebuilder.controller;

import com.resumebuilder.entity.InterviewSession;
import com.resumebuilder.entity.User;
import com.resumebuilder.service.AuthService;
import com.resumebuilder.service.InterviewSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interview-sessions")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class InterviewSessionController {

    @Autowired
    private InterviewSessionService service;

    @Autowired
    private AuthService authService;

    @GetMapping
    public ResponseEntity<?> getSessions(@RequestHeader("Authorization") String authHeader) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        return ResponseEntity.ok(service.getUserSessions(user));
    }

    @PostMapping
    public ResponseEntity<?> saveSession(@RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> sessionData) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        try {
            InterviewSession session = service.saveSession(user, sessionData);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSession(@RequestHeader("Authorization") String authHeader, @PathVariable String id) {
        User user = authService.validateToken(authHeader.substring(7));
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        service.deleteSession(id, user);
        return ResponseEntity.ok(Map.of("message", "Session deleted"));
    }
}
