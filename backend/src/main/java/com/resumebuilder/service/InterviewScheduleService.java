package com.resumebuilder.service;

import com.resumebuilder.entity.InterviewSchedule;
import com.resumebuilder.entity.User;
import com.resumebuilder.repository.InterviewScheduleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class InterviewScheduleService {

    @Autowired
    private InterviewScheduleRepository scheduleRepository;

    @Autowired
    private EmailService emailService;

    public InterviewSchedule createSchedule(Map<String, Object> request, User user) {
        InterviewSchedule schedule = new InterviewSchedule();
        schedule.setUser(user);
        schedule.setInterviewTitle((String) request.get("title"));
        schedule.setInterviewType((String) request.get("interviewType"));
        schedule.setCandidateEmail(user.getEmail());

        // Parse scheduled date time
        String dateTimeStr = (String) request.get("scheduledDateTime");
        schedule.setScheduledDateTime(LocalDateTime.parse(dateTimeStr));

        if (request.containsKey("durationMinutes")) {
            schedule.setDurationMinutes((Integer) request.get("durationMinutes"));
        }

        if (request.containsKey("interviewerEmail")) {
            schedule.setInterviewerEmail((String) request.get("interviewerEmail"));
        }

        if (request.containsKey("meetingLink")) {
            schedule.setMeetingLink((String) request.get("meetingLink"));
        }

        if (request.containsKey("notes")) {
            schedule.setNotes((String) request.get("notes"));
        }

        InterviewSchedule saved = scheduleRepository.save(schedule);

        // Send initial confirmation email
        sendInitialConfirmationEmail(saved);

        return saved;
    }

    public List<InterviewSchedule> getUserSchedules(User user) {
        return scheduleRepository.findByUserOrderByScheduledDateTimeDesc(user);
    }

    public List<InterviewSchedule> getUpcomingInterviews(User user) {
        return scheduleRepository.findUpcomingInterviews(user, LocalDateTime.now());
    }

    public InterviewSchedule getSchedule(String id, User user) {
        Optional<InterviewSchedule> schedule = scheduleRepository.findById(id);
        if (schedule.isPresent() && schedule.get().getUser().getId().equals(user.getId())) {
            return schedule.get();
        }
        return null;
    }

    public InterviewSchedule updateSchedule(String id, Map<String, Object> request, User user) {
        InterviewSchedule schedule = getSchedule(id, user);
        if (schedule == null) {
            return null;
        }

        if (request.containsKey("scheduledDateTime")) {
            String dateTimeStr = (String) request.get("scheduledDateTime");
            schedule.setScheduledDateTime(LocalDateTime.parse(dateTimeStr));
            schedule.setStatus("rescheduled");
            schedule.setReminderSent(false);
            schedule.setDayOfReminderSent(false);
        }

        if (request.containsKey("status")) {
            schedule.setStatus((String) request.get("status"));
        }

        if (request.containsKey("notes")) {
            schedule.setNotes((String) request.get("notes"));
        }

        return scheduleRepository.save(schedule);
    }

    public boolean deleteSchedule(String id, User user) {
        InterviewSchedule schedule = getSchedule(id, user);
        if (schedule == null) {
            return false;
        }

        schedule.setStatus("cancelled");
        scheduleRepository.save(schedule);

        // Send cancellation email
        sendCancellationEmail(schedule);

        return true;
    }

    // Scheduled task: Send day-before reminders (runs every hour)
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void sendDayBeforeReminders() {
        log.info("Running day-before reminder check...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfTomorrow = LocalDate.now().plusDays(1).atStartOfDay();
        LocalDateTime endOfTomorrow = startOfTomorrow.plusDays(1).minusSeconds(1);

        List<InterviewSchedule> interviews = scheduleRepository.findInterviewsForTomorrowReminder(
                startOfTomorrow, endOfTomorrow);

        log.info("Found {} interviews needing day-before reminders", interviews.size());

        for (InterviewSchedule interview : interviews) {
            sendDayBeforeReminderEmail(interview);
            interview.setReminderSent(true);
            interview.setReminderSentAt(now);
            scheduleRepository.save(interview);
        }
    }

    // Scheduled task: Send day-of reminders (runs every 30 minutes)
    @Scheduled(cron = "0 */30 * * * *") // Every 30 minutes
    public void sendDayOfReminders() {
        log.info("Running day-of reminder check...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = startOfToday.plusDays(1).minusSeconds(1);

        List<InterviewSchedule> interviews = scheduleRepository.findInterviewsForTodayReminder(
                startOfToday, endOfToday);

        log.info("Found {} interviews needing day-of reminders", interviews.size());

        for (InterviewSchedule interview : interviews) {
            sendDayOfReminderEmail(interview);
            interview.setDayOfReminderSent(true);
            interview.setDayOfReminderSentAt(now);
            scheduleRepository.save(interview);
        }
    }

    // Handle email responses (confirmation/rescheduling)
    public InterviewSchedule handleEmailResponse(String token, String action, String reason) {
        Optional<InterviewSchedule> optSchedule = scheduleRepository.findByConfirmationToken(token);

        if (optSchedule.isEmpty()) {
            return null;
        }

        InterviewSchedule schedule = optSchedule.get();

        switch (action.toLowerCase()) {
            case "confirm":
                schedule.setStatus("confirmed");
                sendConfirmationAcknowledgmentEmail(schedule);
                break;

            case "reschedule":
                schedule.setRescheduleRequested(true);
                schedule.setRescheduleReason(reason);
                schedule.setStatus("reschedule_requested");
                sendRescheduleRequestEmail(schedule);
                break;

            case "cancel":
                schedule.setStatus("cancelled");
                sendCancellationEmail(schedule);
                break;
        }

        return scheduleRepository.save(schedule);
    }

    // Email sending methods
    private void sendInitialConfirmationEmail(InterviewSchedule schedule) {
        String subject = "Interview Scheduled: " + schedule.getInterviewTitle();
        String confirmLink = generateConfirmationLink(schedule.getConfirmationToken(), "confirm");
        String rescheduleLink = generateConfirmationLink(schedule.getConfirmationToken(), "reschedule");

        String body = String.format(
                "Dear %s,\n\n" +
                        "Your interview has been scheduled!\n\n" +
                        "📅 Date & Time: %s\n" +
                        "⏱️ Duration: %d minutes\n" +
                        "📝 Type: %s\n" +
                        "%s\n\n" +
                        "Please confirm your availability:\n" +
                        "✅ Confirm: %s\n" +
                        "🔄 Reschedule: %s\n\n" +
                        "You will receive a reminder 1 day before and on the day of your interview.\n\n" +
                        "Best regards,\n" +
                        "Interview Team",
                schedule.getUser().getEmail().split("@")[0],
                formatDateTime(schedule.getScheduledDateTime()),
                schedule.getDurationMinutes(),
                schedule.getInterviewType(),
                schedule.getMeetingLink() != null ? "🔗 Meeting Link: " + schedule.getMeetingLink() : "",
                confirmLink,
                rescheduleLink);

        emailService.sendEmail(schedule.getCandidateEmail(), subject, body);
    }

    private void sendDayBeforeReminderEmail(InterviewSchedule schedule) {
        String subject = "Reminder: Interview Tomorrow - " + schedule.getInterviewTitle();
        String confirmLink = generateConfirmationLink(schedule.getConfirmationToken(), "confirm");
        String rescheduleLink = generateConfirmationLink(schedule.getConfirmationToken(), "reschedule");

        String body = String.format(
                "Dear %s,\n\n" +
                        "This is a friendly reminder about your interview scheduled for TOMORROW!\n\n" +
                        "📅 Date & Time: %s\n" +
                        "⏱️ Duration: %d minutes\n" +
                        "📝 Type: %s\n" +
                        "%s\n\n" +
                        "If your plans have changed, please let us know:\n" +
                        "✅ Confirm: %s\n" +
                        "🔄 Reschedule: %s\n" +
                        "❌ Cancel: %s\n\n" +
                        "Looking forward to speaking with you!\n\n" +
                        "Best regards,\n" +
                        "Interview Team",
                schedule.getUser().getEmail().split("@")[0],
                formatDateTime(schedule.getScheduledDateTime()),
                schedule.getDurationMinutes(),
                schedule.getInterviewType(),
                schedule.getMeetingLink() != null ? "🔗 Meeting Link: " + schedule.getMeetingLink() : "",
                confirmLink,
                rescheduleLink,
                generateConfirmationLink(schedule.getConfirmationToken(), "cancel"));

        emailService.sendEmail(schedule.getCandidateEmail(), subject, body);
    }

    private void sendDayOfReminderEmail(InterviewSchedule schedule) {
        String subject = "Today: Interview at " + schedule.getScheduledDateTime().toLocalTime();
        String rescheduleLink = generateConfirmationLink(schedule.getConfirmationToken(), "reschedule");

        String body = String.format(
                "Dear %s,\n\n" +
                        "Your interview is scheduled for TODAY!\n\n" +
                        "⏰ Time: %s\n" +
                        "⏱️ Duration: %d minutes\n" +
                        "📝 Type: %s\n" +
                        "%s\n\n" +
                        "Any last-minute changes? Reply to this email or:\n" +
                        "🔄 Reschedule: %s\n\n" +
                        "We're looking forward to meeting you!\n\n" +
                        "Best regards,\n" +
                        "Interview Team",
                schedule.getUser().getEmail().split("@")[0],
                formatTime(schedule.getScheduledDateTime().toLocalTime()),
                schedule.getDurationMinutes(),
                schedule.getInterviewType(),
                schedule.getMeetingLink() != null ? "🔗 Meeting Link: " + schedule.getMeetingLink() : "",
                rescheduleLink);

        emailService.sendEmail(schedule.getCandidateEmail(), subject, body);
    }

    private void sendConfirmationAcknowledgmentEmail(InterviewSchedule schedule) {
        String subject = "Confirmed: " + schedule.getInterviewTitle();
        String body = String.format(
                "Dear %s,\n\n" +
                        "Thank you for confirming your interview!\n\n" +
                        "📅 Date & Time: %s\n" +
                        "%s\n\n" +
                        "We look forward to speaking with you!\n\n" +
                        "Best regards,\n" +
                        "Interview Team",
                schedule.getUser().getEmail().split("@")[0],
                formatDateTime(schedule.getScheduledDateTime()),
                schedule.getMeetingLink() != null ? "🔗 Meeting Link: " + schedule.getMeetingLink() : "");

        emailService.sendEmail(schedule.getCandidateEmail(), subject, body);
    }

    private void sendRescheduleRequestEmail(InterviewSchedule schedule) {
        String subject = "Reschedule Request Received - " + schedule.getInterviewTitle();
        String body = String.format(
                "Dear %s,\n\n" +
                        "We've received your request to reschedule the interview.\n\n" +
                        "Original Time: %s\n" +
                        "Reason: %s\n\n" +
                        "Our team will contact you shortly with alternative times.\n\n" +
                        "Best regards,\n" +
                        "Interview Team",
                schedule.getUser().getEmail().split("@")[0],
                formatDateTime(schedule.getScheduledDateTime()),
                schedule.getRescheduleReason() != null ? schedule.getRescheduleReason() : "Not specified");

        emailService.sendEmail(schedule.getCandidateEmail(), subject, body);
    }

    private void sendCancellationEmail(InterviewSchedule schedule) {
        String subject = "Interview Cancelled - " + schedule.getInterviewTitle();
        String body = String.format(
                "Dear %s,\n\n" +
                        "Your interview scheduled for %s has been cancelled.\n\n" +
                        "If you'd like to reschedule, please contact us.\n\n" +
                        "Best regards,\n" +
                        "Interview Team",
                schedule.getUser().getEmail().split("@")[0],
                formatDateTime(schedule.getScheduledDateTime()));

        emailService.sendEmail(schedule.getCandidateEmail(), subject, body);
    }

    private String generateConfirmationLink(String token, String action) {
        // In production, use actual domain
        return String.format("http://localhost:8080/api/interview-schedule/respond?token=%s&action=%s",
                token, action);
    }

    private String formatDateTime(LocalDateTime dateTime) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a");
        return dateTime.format(formatter);
    }

    private String formatTime(LocalTime time) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a");
        return time.format(formatter);
    }
}
