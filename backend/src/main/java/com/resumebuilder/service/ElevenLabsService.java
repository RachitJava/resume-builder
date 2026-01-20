package com.resumebuilder.service;

import com.resumebuilder.entity.AiProviderConfig;
import com.resumebuilder.repository.AiProviderConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ElevenLabsService {

    private final AiProviderConfigRepository aiProviderConfigRepository;
    private final RestTemplate restTemplate;

    @Value("${elevenlabs.api.key:}")
    private String defaultApiKey;

    @Value("${elevenlabs.voice.id:21m00Tcm4TlvDq8ikWAM}") // Default to 'Rachel'
    private String defaultVoiceId;

    private static final String BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech";

    public String generateAudio(String text) {
        // 1. Get Effective Configuration (DB overrides Property)
        String apiKey = defaultApiKey;
        String voiceId = defaultVoiceId;

        Optional<AiProviderConfig> ttsConfig = aiProviderConfigRepository
                .findByActiveTrueAndType(AiProviderConfig.ProviderType.TTS);
        if (ttsConfig.isPresent()) {
            AiProviderConfig c = ttsConfig.get();
            if (c.getApiKeys() != null && !c.getApiKeys().isEmpty()) {
                apiKey = c.getApiKeys().get(0); // Use first active key
            }
            // Use 'modelName' field in DB to store Voice ID for flexibility
            if (c.getModelName() != null && !c.getModelName().isEmpty()) {
                voiceId = c.getModelName();
            }
            log.info("Using ElevenLabs Config from DB. Provider: {}, VoiceID: {}", c.getProviderName(), voiceId);
        }

        if (apiKey == null || apiKey.isEmpty() || "your-elevenlabs-key".equals(apiKey)) {
            log.warn("ElevenLabs API Key not configured. Skipping TTS.");
            return null;
        }

        // 2. Construct URL
        String fullUrl = BASE_URL + "/" + voiceId;

        try {
            // 3. Prepare Request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("xi-api-key", apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("text", text);
            body.put("model_id", "eleven_multilingual_v2");

            Map<String, Object> voiceSettings = new HashMap<>();
            voiceSettings.put("stability", 0.5);
            voiceSettings.put("similarity_boost", 0.75);
            body.put("voice_settings", voiceSettings);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            // 4. Execute
            ResponseEntity<byte[]> response = restTemplate.exchange(fullUrl, HttpMethod.POST, entity, byte[].class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String base64Audio = Base64.getEncoder().encodeToString(response.getBody());
                log.info("Generated Audio with ElevenLabs for text length: {}", text.length());
                return "data:audio/mpeg;base64," + base64Audio;
            } else {
                log.error("ElevenLabs API returned status: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error generating audio with ElevenLabs: {}", e.getMessage());
        }
        return null;
    }
}
