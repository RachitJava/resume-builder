package com.resumebuilder.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final ApiKeyService apiKeyService;

    @Value("${spring.mail.username:noreply@resumebuilder.com}")
    private String fromEmail;

    public EmailService(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    public void sendOtpEmail(String to, String otp) {
        // Always log OTP for development/debugging
        log.info("========================================");
        log.info("OTP for {}: {}", to, otp);
        log.info("========================================");

        if (mailSender == null) {
            log.warn("Mail sender not configured. OTP logged above.");
            return;
        }

        try {
            // Update password from database keys if available
            try {
                String dbMailKey = apiKeyService.getActiveApiKey("mail");
                if (dbMailKey != null && mailSender instanceof JavaMailSenderImpl) {
                    ((JavaMailSenderImpl) mailSender).setPassword(dbMailKey);
                    log.info("Using Mail key from database");
                }
            } catch (Exception e) {
                log.debug("No Mail key in database, using system default: {}", e.getMessage());
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Your ResumeForge Login OTP");
            message.setText(String.format("""
                    Hello,

                    Your one-time password (OTP) for ResumeForge login is:

                    %s

                    This OTP will expire in 10 minutes.

                    If you didn't request this, please ignore this email.

                    Best regards,
                    ResumeForge Team
                    """, otp));

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            log.warn("Use the OTP logged above for testing");
        }
    }
}
