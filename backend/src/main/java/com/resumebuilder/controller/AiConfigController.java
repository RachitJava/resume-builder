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
        // Return all configs, including any manual Gemini/Browser ones if the admin
        // added them
        return ResponseEntity.ok(repository.findAll());
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

        AiProviderConfig targetConfig = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Config not found"));
        AiProviderConfig.ProviderType targetType = targetConfig.getType();

        List<AiProviderConfig> all = repository.findAll();
        for (AiProviderConfig c : all) {
            // Only deactivate configs of the SAME TYPE
            // Legacy/Null types are treated as RESUME type for safety
            AiProviderConfig.ProviderType cType = c.getType() != null ? c.getType()
                    : AiProviderConfig.ProviderType.RESUME;
            AiProviderConfig.ProviderType tType = targetType != null ? targetType
                    : AiProviderConfig.ProviderType.RESUME;

            if (cType == tType) {
                c.setActive(c.getId().equals(id));
            }
        }
        repository.saveAll(all);
        return ResponseEntity
                .ok(Map.of("message", "Activated for type: " + (targetType != null ? targetType : "RESUME")));
    }

    @PostMapping("/{id}/select-key/{index}")
    public ResponseEntity<?> selectKey(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id, @PathVariable int index) {
        if (!authService.isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin access required"));
        }
        AiProviderConfig config = repository.findById(id).orElseThrow();
        if (index < 0 || index >= config.getApiKeys().size()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid key index"));
        }
        config.setCurrentKeyIndex(index);
        return ResponseEntity.ok(repository.save(config));
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
