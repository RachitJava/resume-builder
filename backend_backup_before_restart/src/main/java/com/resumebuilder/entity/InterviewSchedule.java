package com.resumebuilder.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_schedules")
@Data
public class InterviewSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "interview_title", nullable = false)
    private String interviewTitle;

    @Column(name = "interview_type")
    private String interviewType; // hr, technical, coding, etc.

    @Column(name = "scheduled_date_time", nullable = false)
    private LocalDateTime scheduledDateTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;

    @Column(name = "interviewer_email")
    private String interviewerEmail;

    @Column(name = "candidate_email", nullable = false)
    private String candidateEmail;

    @Column(name = "meeting_link")
    private String meetingLink;

    @Column(name = "status")
    private String status = "scheduled"; // scheduled, confirmed, rescheduled, cancelled, completed

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;

    @Column(name = "reminder_sent_at")
    private LocalDateTime reminderSentAt;

    @Column(name = "day_of_reminder_sent")
    private Boolean dayOfReminderSent = false;

    @Column(name = "day_of_reminder_sent_at")
    private LocalDateTime dayOfReminderSentAt;

    @Column(name = "confirmation_token")
    private String confirmationToken;

    @Column(name = "reschedule_requested")
    private Boolean rescheduleRequested = false;

    @Column(name = "reschedule_reason", length = 1000)
    private String rescheduleReason;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (confirmationToken == null) {
            confirmationToken = java.util.UUID.randomUUID().toString();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
