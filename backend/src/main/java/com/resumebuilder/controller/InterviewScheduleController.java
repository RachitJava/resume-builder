package com.resumebuilder.controller;

import com.resumebuilder.entity.InterviewSchedule;
import com.resumebuilder.entity.User;
import com.resumebuilder.service.AuthService;
import com.resumebuilder.service.InterviewScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interview-schedule")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class InterviewScheduleController {

    @Autowired
    private InterviewScheduleService scheduleService;

    @Autowired
    private AuthService authService;

    @PostMapping
    public ResponseEntity<?> createSchedule(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> request) {
        try {
            User user = authService.validateToken(token.replace("Bearer ", ""));
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            InterviewSchedule schedule = scheduleService.createSchedule(request, user);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserSchedules(@RequestHeader("Authorization") String token) {
        try {
            User user = authService.validateToken(token.replace("Bearer ", ""));
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            List<InterviewSchedule> schedules = scheduleService.getUserSchedules(user);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingInterviews(@RequestHeader("Authorization") String token) {
        try {
            User user = authService.validateToken(token.replace("Bearer ", ""));
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            List<InterviewSchedule> schedules = scheduleService.getUpcomingInterviews(user);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSchedule(
            @RequestHeader("Authorization") String token,
            @PathVariable String id) {
        try {
            User user = authService.validateToken(token.replace("Bearer ", ""));
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            InterviewSchedule schedule = scheduleService.getSchedule(id, user);
            if (schedule == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSchedule(
            @RequestHeader("Authorization") String token,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            User user = authService.validateToken(token.replace("Bearer ", ""));
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            InterviewSchedule schedule = scheduleService.updateSchedule(id, request, user);
            if (schedule == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSchedule(
            @RequestHeader("Authorization") String token,
            @PathVariable String id) {
        try {
            User user = authService.validateToken(token.replace("Bearer ", ""));
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            boolean deleted = scheduleService.deleteSchedule(id, user);
            if (!deleted) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(Map.of("message", "Interview cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Public endpoint for email response handling (no auth required)
    @GetMapping("/respond")
    public ResponseEntity<?> handleEmailResponse(
            @RequestParam String token,
            @RequestParam String action,
            @RequestParam(required = false) String reason) {
        try {
            InterviewSchedule schedule = scheduleService.handleEmailResponse(token, action, reason);

            if (schedule == null) {
                return ResponseEntity.badRequest().body(
                        "<html><body><h2>Invalid or expired link</h2></body></html>");
            }

            String message = "";
            switch (action.toLowerCase()) {
                case "confirm":
                    message = "✅ Interview confirmed! You'll receive a reminder on the day of your interview.";
                    break;
                case "reschedule":
                    message = "🔄 Reschedule request received. Our team will contact you with alternative times.";
                    break;
                case "cancel":
                    message = "❌ Interview cancelled. We hope to speak with you in the future!";
                    break;
            }

            String html = String.format(
                    "<html><head><style>" +
                            "body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }"
                            +
                            "h2 { color: #333; }" +
                            "p { color: #666; font-size: 18px; }" +
                            "</style></head><body>" +
                            "<h2>%s</h2>" +
                            "<p>Interview: %s</p>" +
                            "<p>Scheduled: %s</p>" +
                            "</body></html>",
                    message,
                    schedule.getInterviewTitle(),
                    schedule.getScheduledDateTime().toString());

            return ResponseEntity.ok()
                    .header("Content-Type", "text/html")
                    .body(html);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    "<html><body><h2>Error: " + e.getMessage() + "</h2></body></html>");
        }
    }
}
