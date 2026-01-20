package com.resumebuilder.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiProviderConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String providerName; // "gemini", "openai", "groq"

    private String apiUrl;
    private String modelName;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "ai_provider_keys", joinColumns = @JoinColumn(name = "provider_id"))
    @Column(name = "api_key")
    private List<String> apiKeys = new ArrayList<>();

    private int currentKeyIndex = 0;

    private boolean active = false;
}
