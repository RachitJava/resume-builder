package com.resumebuilder.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ApiKeyDTO {
    private String id;
    private String name;
    private String provider;
    private String owner;
    private String apiKey; // Masked for responses
    private boolean active;
    private int priority;
    private long tokensUsed;
    private long tokenLimit;
    private LocalDateTime lastUsed;
    private LocalDateTime lastError;
    private String lastErrorMessage;
    private int consecutiveErrors;
    private LocalDateTime createdAt;

    @Data
    public static class CreateRequest {
        private String name;
        private String provider = "groq";
        private String owner;
        private String apiKey;
        private int priority = 0;
        private long tokenLimit = 0;
    }

    @Data
    public static class UpdateRequest {
        private String name;
        private String owner;
        private boolean active;
        private int priority;
        private long tokenLimit;
    }
}
