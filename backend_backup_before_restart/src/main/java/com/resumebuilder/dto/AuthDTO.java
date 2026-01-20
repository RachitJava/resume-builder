package com.resumebuilder.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class AuthDTO {

    @Data
    public static class SendOtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Data
    public static class VerifyOtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "OTP is required")
        private String otp;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String userId;
        private String email;
        private String message;

        public AuthResponse(String message) {
            this.message = message;
        }

        public AuthResponse(String token, String userId, String email) {
            this.token = token;
            this.userId = userId;
            this.email = email;
            this.message = "Login successful";
        }
    }
}

