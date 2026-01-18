package com.resumebuilder.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    private String otp;
    private LocalDateTime otpExpiry;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("isAdmin")
    private boolean isAdmin = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
