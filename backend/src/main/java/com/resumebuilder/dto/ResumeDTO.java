package com.resumebuilder.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class ResumeDTO {
    private String id;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;
    private String location;
    private String linkedIn;
    private String github;
    private String website;
    private String summary;

    private List<Experience> experience;
    private List<Education> education;
    private List<String> skills;
    private List<Project> projects;
    private List<String> certifications;

    private String template;

    @Data
    public static class Experience {
        private String company;
        private String position;
        private String location;
        private String startDate;
        private String endDate;
        private String description;
        private List<String> highlights;
        
        // For service-based companies with multiple clients
        private boolean serviceBased;
        private List<ClientProject> clientProjects;
    }
    
    @Data
    public static class ClientProject {
        private String clientName;
        private String projectName;
        private String role;
        private String startDate;
        private String endDate;
        private String description;
        private List<String> highlights;
    }

    @Data
    public static class Education {
        private String institution;
        private String degree;
        private String field;
        private String startDate;
        private String endDate;
        private String gpa;
    }

    @Data
    public static class Project {
        private String name;
        private String description;
        private String url;
        private List<String> technologies;
    }
}

