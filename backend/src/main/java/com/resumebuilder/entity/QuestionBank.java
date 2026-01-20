package com.resumebuilder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_question_banks")
public class QuestionBank {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name; // e.g., "Java Backend Questions", "React Interview"

    @Column(nullable = false)
    private String category; // hr, technical, coding, technical_coding, mixed

    @Column(length = 1000)
    private String description;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questions; // JSON array of {question, answer, difficulty, tags[]}

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isPublic")
    private boolean isPublic = false; // New: Public/Private visibility

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isAnonymous")
    private boolean isAnonymous = false; // New: Option to hide creator identity

    @Column(nullable = false)
    private Integer usageCount = 0; // New: Track how many times this bank was used

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
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

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getQuestions() {
        return questions;
    }

    public void setQuestions(String questions) {
        this.questions = questions;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isPublic")
    public boolean isPublic() {
        return isPublic;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isPublic")
    public void setPublic(boolean isPublic) {
        this.isPublic = isPublic;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isAnonymous")
    public boolean isAnonymous() {
        return isAnonymous;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isAnonymous")
    public void setAnonymous(boolean anonymous) {
        isAnonymous = anonymous;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Integer usageCount) {
        this.usageCount = usageCount;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
