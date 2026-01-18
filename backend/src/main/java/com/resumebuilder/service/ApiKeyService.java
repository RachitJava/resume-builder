package com.resumebuilder.service;

import com.resumebuilder.dto.ApiKeyDTO;
import com.resumebuilder.entity.ApiKey;
import com.resumebuilder.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiKeyService {

    private final ApiKeyRepository repository;

    @Value("${ai.api.key:}")
    private String fallbackApiKey;

    private static final int MAX_CONSECUTIVE_ERRORS = 3;

    /**
     * Get the next available API key for a provider with failover support
     */
    public String getActiveApiKey(String provider) {
        // Try to get from database first
        Optional<ApiKey> keyOpt = repository.findFirstByProviderAndActiveAndConsecutiveErrorsLessThanOrderByPriorityAsc(
                provider, true, MAX_CONSECUTIVE_ERRORS);

        if (keyOpt.isPresent()) {
            ApiKey key = keyOpt.get();
            key.setLastUsed(LocalDateTime.now());
            repository.save(key);
            return key.getApiKey();
        }

        // Fall back to environment variable
        if (fallbackApiKey != null && !fallbackApiKey.isEmpty()) {
            log.warn("Using fallback API key from environment");
            return fallbackApiKey;
        }

        throw new RuntimeException("No active API keys available for provider: " + provider);
    }

    public Optional<ApiKey> getActiveKeyEntity(String provider) {
        return repository.findFirstByProviderAndActiveAndConsecutiveErrorsLessThanOrderByPriorityAsc(
                provider, true, MAX_CONSECUTIVE_ERRORS);
    }

    /**
     * Report a successful API call
     */
    public void reportSuccess(String provider, long tokensUsed) {
        repository.findFirstByProviderAndActiveAndConsecutiveErrorsLessThanOrderByPriorityAsc(
                provider, true, MAX_CONSECUTIVE_ERRORS + 1)
                .ifPresent(key -> {
                    key.setConsecutiveErrors(0);
                    key.setTokensUsed(key.getTokensUsed() + tokensUsed);
                    key.setLastUsed(LocalDateTime.now());
                    repository.save(key);
                });
    }

    /**
     * Report a failed API call - enables failover to next key
     */
    public void reportError(String provider, String errorMessage) {
        repository.findFirstByProviderAndActiveAndConsecutiveErrorsLessThanOrderByPriorityAsc(
                provider, true, MAX_CONSECUTIVE_ERRORS + 1)
                .ifPresent(key -> {
                    key.setConsecutiveErrors(key.getConsecutiveErrors() + 1);
                    key.setLastError(LocalDateTime.now());
                    key.setLastErrorMessage(errorMessage);
                    repository.save(key);
                    log.warn("API key {} has {} consecutive errors", key.getName(), key.getConsecutiveErrors());
                });
    }

    /**
     * Reset error count for a key (admin action)
     */
    public void resetErrors(String keyId) {
        repository.findById(keyId).ifPresent(key -> {
            key.setConsecutiveErrors(0);
            key.setLastError(null);
            key.setLastErrorMessage(null);
            repository.save(key);
        });
    }

    // CRUD Operations
    public List<ApiKeyDTO> getAllKeys() {
        return repository.findAllByOrderByPriorityAsc().stream()
                .map(this::toDTO)
                .toList();
    }

    public ApiKeyDTO createKey(ApiKeyDTO.CreateRequest request) {
        ApiKey key = new ApiKey();
        key.setName(request.getName());
        key.setProvider(request.getProvider());
        key.setOwner(request.getOwner());
        key.setApiKey(request.getApiKey());
        key.setPriority(request.getPriority());
        key.setTokenLimit(request.getTokenLimit());
        key.setActive(true);

        key = repository.save(key);
        log.info("Created API key: {}", key.getName());
        return toDTO(key);
    }

    public ApiKeyDTO updateKey(String id, ApiKeyDTO.UpdateRequest request) {
        ApiKey key = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("API key not found: " + id));

        if (request.getName() != null)
            key.setName(request.getName());
        if (request.getOwner() != null)
            key.setOwner(request.getOwner());
        key.setActive(request.isActive());
        key.setPriority(request.getPriority());
        key.setTokenLimit(request.getTokenLimit());

        key = repository.save(key);
        return toDTO(key);
    }

    public void deleteKey(String id) {
        repository.deleteById(id);
        log.info("Deleted API key: {}", id);
    }

    private ApiKeyDTO toDTO(ApiKey key) {
        ApiKeyDTO dto = new ApiKeyDTO();
        dto.setId(key.getId());
        dto.setName(key.getName());
        dto.setProvider(key.getProvider());
        dto.setOwner(key.getOwner());
        // Mask API key - show only last 4 chars
        String masked = "****" + key.getApiKey().substring(Math.max(0, key.getApiKey().length() - 4));
        dto.setApiKey(masked);
        dto.setActive(key.isActive());
        dto.setPriority(key.getPriority());
        dto.setTokensUsed(key.getTokensUsed());
        dto.setTokenLimit(key.getTokenLimit());
        dto.setLastUsed(key.getLastUsed());
        dto.setLastError(key.getLastError());
        dto.setLastErrorMessage(key.getLastErrorMessage());
        dto.setConsecutiveErrors(key.getConsecutiveErrors());
        dto.setCreatedAt(key.getCreatedAt());
        return dto;
    }
}
