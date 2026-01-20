package com.resumebuilder.service;

import com.resumebuilder.entity.AiProviderConfig;
import com.resumebuilder.repository.AiProviderConfigRepository;
import com.resumebuilder.repository.QuestionBankRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AiInterviewServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private QuestionBankRepository questionBankRepository;

    @Mock
    private AiSettingsService aiSettingsService;

    @Mock
    private AiProviderConfigRepository aiProviderConfigRepository;

    @InjectMocks
    private AiInterviewService aiInterviewService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Inject values
        ReflectionTestUtils.setField(aiInterviewService, "defaultAiApiUrl", "http://default");
        ReflectionTestUtils.setField(aiInterviewService, "defaultAiApiKey", "default-key");
        ReflectionTestUtils.setField(aiInterviewService, "defaultAiModel", "model");
    }

    @Test
    void testRotationOn429() {
        System.out.println("TEST: Starting API Key Rotation Test...");

        // Setup Config with 2 keys
        AiProviderConfig config = new AiProviderConfig();
        config.setProviderName("TestProvider");
        config.setActive(true);
        config.setType(AiProviderConfig.ProviderType.INTERVIEW);
        config.setApiUrl("http://api");
        config.setModelName("model");
        // Using a modifiable list for keys
        config.setApiKeys(new ArrayList<>(Arrays.asList("key1", "key2")));
        config.setCurrentKeyIndex(0);

        when(aiSettingsService.canUseExternalAi()).thenReturn(true);
        when(aiProviderConfigRepository.findByActiveTrueAndType(AiProviderConfig.ProviderType.INTERVIEW))
                .thenReturn(Optional.of(config));

        // Mock RestTemplate to fail first then succeed
        // First call: 429
        when(restTemplate.exchange(eq("http://api"), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests"))
                .thenReturn(ResponseEntity
                        .ok(Map.of("choices", List.of(Map.of("message", Map.of("content", "Success Response"))))));

        // Input
        Map<String, Object> request = new HashMap<>();
        request.put("profile", Map.of(
                "role", "Dev",
                "experience", "Junior",
                "skills", "Java",
                "interviewType", "technical"));
        request.put("conversationHistory", new ArrayList<>());

        // Execute
        System.out.println("TEST: Calling generateInterviewResponse (expecting rotation)...");
        Map<String, Object> result = aiInterviewService.generateInterviewResponse(request);

        // Verification
        System.out.println("TEST: Result Response: " + result.get("response"));

        // 1. Should succeed
        assertEquals("Success Response", result.get("response"));

        // 2. Config should have rotated index to 1
        assertEquals(1, config.getCurrentKeyIndex(), "Key Index should have rotated to 1");

        // 3. Rest Template should be called twice (1 fail + 1 retry)
        verify(restTemplate, times(2)).exchange(anyString(), any(), any(), eq(Map.class));

        // 4. Save was called to persist index
        verify(aiProviderConfigRepository, times(1)).save(config);

        System.out.println("TEST: Rotation Confirmed Successfully!");
    }
}
