package com.resumebuilder.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

public class AiDTO {

    @Data
    public static class ChatRequest {
        private String jobDescription;
        private ResumeDTO currentResume;
        private String message;
    }

    @Data
    public static class ChatResponse {
        private String message;
        private ResumeDTO suggestedUpdates;
        private List<String> suggestedSkills;
        private String suggestedSummary;
    }

    @Data
    public static class OptimizeRequest {
        private ResumeDTO currentResume;
        private Map<String, Object> options;
    }

    @Data
    @lombok.EqualsAndHashCode(callSuper = true)
    public static class OptimizeResponse extends ResumeDTO {
        private String message;
        private List<String> changes;
    }

    @Data
    public static class OpenAiRequest {
        private String model;
        private List<Message> messages;
        private double temperature = 0.7;

        @Data
        public static class Message {
            private String role;
            private String content;

            public Message(String role, String content) {
                this.role = role;
                this.content = content;
            }
        }
    }

    @Data
    public static class OpenAiResponse {
        private List<Choice> choices;

        @Data
        public static class Choice {
            private Message message;
        }

        @Data
        public static class Message {
            private String content;
        }
    }

}
