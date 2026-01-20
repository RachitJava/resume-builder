package com.resumebuilder.controller;

import com.resumebuilder.dto.ApiKeyDTO;
import com.resumebuilder.entity.User;
import com.resumebuilder.service.ApiKeyService;
import com.resumebuilder.service.AuthService;
import com.resumebuilder.repository.UserRepository;
import com.resumebuilder.repository.TemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ApiKeyService apiKeyService;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final TemplateRepository templateRepository;
    private final com.resumebuilder.service.AiService aiService;

    // ===== API KEYS =====
    @GetMapping("/api-keys")
    public ResponseEntity<?> getAllApiKeys(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        List<ApiKeyDTO> keys = apiKeyService.getAllKeys();
        return ResponseEntity.ok(keys);
    }

    @PostMapping("/api-keys")
    public ResponseEntity<?> createApiKey(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ApiKeyDTO.CreateRequest request) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        ApiKeyDTO key = apiKeyService.createKey(request);
        return ResponseEntity.ok(key);
    }

    @PutMapping("/api-keys/{id}")
    public ResponseEntity<?> updateApiKey(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestBody ApiKeyDTO.UpdateRequest request) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        ApiKeyDTO key = apiKeyService.updateKey(id, request);
        return ResponseEntity.ok(key);
    }

    @DeleteMapping("/api-keys/{id}")
    public ResponseEntity<?> deleteApiKey(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        apiKeyService.deleteKey(id);
        return ResponseEntity.ok(Map.of("message", "API key deleted"));
    }

    @PostMapping("/api-keys/{id}/reset-errors")
    public ResponseEntity<?> resetErrors(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        apiKeyService.resetErrors(id);
        return ResponseEntity.ok(Map.of("message", "Errors reset"));
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkAdmin(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(Map.of("isAdmin", authService.isAdmin(authHeader)));
    }

    @PostMapping("/claim")
    public ResponseEntity<?> claimAdminAccess(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Login required"));
        }

        User user = authService.validateToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token"));
        }

        // List of allowed admin emails
        List<String> allowedAdmins = List.of("rachitbishnoi28@gmail.com", "rachitbishnoi16@gmail.com");

        if (allowedAdmins.contains(user.getEmail())) {
            user.setAdmin(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Admin access granted for " + user.getEmail(),
                    "isAdmin", true));
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "This email is not authorized for admin access",
                    "email", user.getEmail()));
        }
    }

    // ===== USER MANAGEMENT =====
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody User user) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id, @RequestBody User userDetails) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        User user = userRepository.findById(id).orElseThrow();

        // PROTECT SUPER ADMIN
        if ("rachitbishnoi28@gmail.com".equals(user.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cannot modify Super Admin account"));
        }

        user.setAdmin(userDetails.isAdmin());
        // Only update email if it's changing and not empty
        if (userDetails.getEmail() != null && !userDetails.getEmail().isEmpty()) {
            user.setEmail(userDetails.getEmail());
        }
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        User user = userRepository.findById(id).orElseThrow();

        // PROTECT SUPER ADMIN
        if ("rachitbishnoi28@gmail.com".equals(user.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cannot delete Super Admin account"));
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    // ===== TEMPLATE MANAGEMENT =====
    @GetMapping("/templates")
    public ResponseEntity<?> getAllTemplates(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(templateRepository.findAll());
    }

    @PostMapping("/templates/generate-ai")
    public ResponseEntity<?> generateTemplateFromAI(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> request) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }

        String description = request.get("description");
        Map<String, String> metadata = aiService.generateTemplateMetadata(description);

        com.resumebuilder.entity.Template template = new com.resumebuilder.entity.Template();
        template.setId(java.util.UUID.randomUUID().toString());
        template.setName(metadata.getOrDefault("name", "AI Template"));
        template.setDescription(metadata.getOrDefault("description", description));
        template.setBaseStyle(metadata.getOrDefault("baseStyle", "modern"));
        template.setCountry(metadata.getOrDefault("country", "usa"));

        return ResponseEntity.ok(templateRepository.save(template));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<?> deleteTemplate(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        templateRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Template deleted"));
    }
}
