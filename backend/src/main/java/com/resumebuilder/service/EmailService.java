package com.resumebuilder.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.Optional;

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
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Your DecisiveML Login OTP");

            // Update password from database keys if available
            try {
                Optional<com.resumebuilder.entity.ApiKey> mailKeyOpt = apiKeyService.getActiveKeyEntity("mail");
                if (mailKeyOpt.isPresent() && mailSender instanceof JavaMailSenderImpl) {
                    ((JavaMailSenderImpl) mailSender).setPassword(mailKeyOpt.get().getApiKey());
                    if (mailKeyOpt.get().getOwner() != null && !mailKeyOpt.get().getOwner().isEmpty()) {
                        ((JavaMailSenderImpl) mailSender).setUsername(mailKeyOpt.get().getOwner());
                        message.setFrom(mailKeyOpt.get().getOwner());
                        log.info("Using Mail key from database. From: {}", mailKeyOpt.get().getOwner());
                    } else {
                        log.info("Using Mail key from database (Default From address)");
                    }
                }
            } catch (Exception e) {
                log.debug("No Mail key in database, using system default: {}", e.getMessage());
            }
            message.setSubject("Your DecisiveML Login OTP");
            message.setText(String.format("""
                    Hello,

                    Your one-time password (OTP) for DecisiveML login is:

                    %s

                    This OTP will expire in 10 minutes.

                    If you didn't request this, please ignore this email.

                    Best regards,
                    DecisiveML Team
                    """, otp));

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            log.warn("Use the OTP logged above for testing");
        }
    }
}
