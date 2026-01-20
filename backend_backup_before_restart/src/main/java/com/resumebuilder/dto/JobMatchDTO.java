package com.resumebuilder.dto;

import lombok.Data;
import java.util.List;

@Data
public class JobMatchDTO {
    
    @Data
    public static class JobAnalysisRequest {
        private String jobDescription;
        private String jobTitle;
        private String company;
        private ResumeDTO existingResume; // Optional - to tailor existing resume
    }
    
    @Data
    public static class JobAnalysisResponse {
        private String jobTitle;
        private String company;
        private List<String> requiredSkills;
        private List<String> preferredSkills;
        private List<String> keywords;
        private String experienceLevel;
        private String summary;
        private ResumeDTO tailoredResume;
        private List<String> suggestions;
        private int matchScore; // 0-100
    }
}

