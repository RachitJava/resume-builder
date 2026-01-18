package com.resumebuilder.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name; // e.g., "Groq Account 1"

    @Column(nullable = false)
    private String provider; // e.g., "groq", "openai"

    @Column(nullable = false, length = 500)
    private String apiKey;

    private String owner; // e.g. email address for mail keys

    private boolean active = true;

    private int priority = 0; // Lower = higher priority

    private long tokensUsed = 0;

    private long tokenLimit = 0; // 0 = unlimited

    private LocalDateTime lastUsed;

    private LocalDateTime lastError;

    private String lastErrorMessage;

    private int consecutiveErrors = 0;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
