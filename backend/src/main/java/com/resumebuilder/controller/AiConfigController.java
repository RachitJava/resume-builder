package com.resumebuilder.controller;

import com.resumebuilder.entity.AiProviderConfig;
import com.resumebuilder.repository.AiProviderConfigRepository;
import com.resumebuilder.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/ai-config")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiConfigController {
    private final AiProviderConfigRepository repository;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        List<AiProviderConfig> all = repository.findAll();
        // Aggressively filter out GEMINI or BROWSER configs from the result
        List<AiProviderConfig> filtered = all.stream()
                .filter(c -> {
                    String name = c.getProviderName().toLowerCase();
                    boolean isUnauthorized = name.contains("gemini") || name.contains("browser");
                    if (isUnauthorized) {
                        // Attempt to delete it from DB the background if it's still there
                        try {
                            repository.delete(c);
                        } catch (Exception e) {
                        }
                    }
                    return !isUnauthorized;
                })
                .toList();
        return ResponseEntity.ok(filtered);
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody AiProviderConfig config) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        if (repository.count() == 0) {
            config.setActive(true);
        }
        return ResponseEntity.ok(repository.save(config));
    }

    @PostMapping("/{id}/keys")
    public ResponseEntity<?> addKey(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id, @RequestBody String key) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        AiProviderConfig config = repository.findById(id).orElseThrow();
        if (config.getApiKeys() == null)
            config.setApiKeys(new ArrayList<>());
        config.getApiKeys().add(key.replace("\"", ""));
        return ResponseEntity.ok(repository.save(config));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activate(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        List<AiProviderConfig> all = repository.findAll();
        for (AiProviderConfig c : all) {
            c.setActive(c.getId().equals(id));
        }
        repository.saveAll(all);
        return ResponseEntity.ok(Map.of("message", "Activated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
