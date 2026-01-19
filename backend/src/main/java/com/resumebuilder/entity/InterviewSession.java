package com.resumebuilder.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "interview_sessions")
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String role; // e.g. "Java Developer"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String transcript; // JSON string of conversation

    private String feedbackSummary; // The AI feedback text

    @CreationTimestamp
    private LocalDateTime createdAt;
}
