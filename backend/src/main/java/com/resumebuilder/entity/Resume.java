package com.resumebuilder.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId; // User's email who owns this resume

    @Column(nullable = false)
    private String fullName;

    private String email;
    private String phone;
    private String location;
    private String linkedIn;
    private String github;
    private String website;

    @Column(length = 1000)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String experience; // JSON string

    @Column(columnDefinition = "TEXT")
    private String education; // JSON string

    @Column(columnDefinition = "TEXT")
    private String skills; // JSON string

    @Column(columnDefinition = "TEXT")
    private String projects; // JSON string

    @Column(columnDefinition = "TEXT")
    private String certifications; // JSON string

    private String template = "modern";

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

