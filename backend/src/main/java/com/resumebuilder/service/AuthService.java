package com.resumebuilder.service;

import com.resumebuilder.dto.AuthDTO;
import com.resumebuilder.entity.User;
import com.resumebuilder.entity.UserSession;
import com.resumebuilder.repository.UserRepository;
import com.resumebuilder.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final EmailService emailService;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int SESSION_EXPIRY_DAYS = 7;

    public AuthDTO.AuthResponse sendOtp(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        
        // Find or create user
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(normalizedEmail);
                    return newUser;
                });

        // Generate OTP
        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        userRepository.save(user);

        // Send email
        emailService.sendOtpEmail(normalizedEmail, otp);
        
        log.info("OTP sent to: {}", normalizedEmail);
        return new AuthDTO.AuthResponse("OTP sent to " + normalizedEmail);
    }

    @Transactional
    public AuthDTO.AuthResponse verifyOtp(String email, String otp) {
        String normalizedEmail = email.toLowerCase().trim();
        
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found. Please request OTP first."));

        // Validate OTP
        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        // Clear OTP
        user.setOtp(null);
        user.setOtpExpiry(null);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Create session
        String token = UUID.randomUUID().toString();
        UserSession session = new UserSession();
        session.setUserId(user.getId());
        session.setToken(token);
        session.setExpiresAt(LocalDateTime.now().plusDays(SESSION_EXPIRY_DAYS));
        sessionRepository.save(session);

        log.info("User logged in: {}", normalizedEmail);
        return new AuthDTO.AuthResponse(token, user.getId(), user.getEmail());
    }

    public User validateToken(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }

        UserSession session = sessionRepository.findByToken(token).orElse(null);
        if (session == null || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            return null;
        }

        return userRepository.findById(session.getUserId()).orElse(null);
    }

    @Transactional
    public void logout(String token) {
        sessionRepository.findByToken(token).ifPresent(session -> {
            sessionRepository.deleteByUserId(session.getUserId());
        });
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }
}

