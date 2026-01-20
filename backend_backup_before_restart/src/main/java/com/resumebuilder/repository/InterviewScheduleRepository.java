package com.resumebuilder.repository;

import com.resumebuilder.entity.InterviewSchedule;
import com.resumebuilder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, String> {

    List<InterviewSchedule> findByUserOrderByScheduledDateTimeDesc(User user);

    List<InterviewSchedule> findByUserAndStatusOrderByScheduledDateTimeDesc(User user, String status);

    Optional<InterviewSchedule> findByConfirmationToken(String token);

    // Find interviews scheduled for tomorrow (for day-before reminders)
    @Query("SELECT i FROM InterviewSchedule i WHERE " +
            "i.scheduledDateTime BETWEEN :startOfTomorrow AND :endOfTomorrow " +
            "AND i.reminderSent = false " +
            "AND i.status = 'scheduled'")
    List<InterviewSchedule> findInterviewsForTomorrowReminder(
            @Param("startOfTomorrow") LocalDateTime startOfTomorrow,
            @Param("endOfTomorrow") LocalDateTime endOfTomorrow);

    // Find interviews scheduled for today (for day-of reminders)
    @Query("SELECT i FROM InterviewSchedule i WHERE " +
            "i.scheduledDateTime BETWEEN :startOfToday AND :endOfToday " +
            "AND i.dayOfReminderSent = false " +
            "AND i.status IN ('scheduled', 'confirmed')")
    List<InterviewSchedule> findInterviewsForTodayReminder(
            @Param("startOfToday") LocalDateTime startOfToday,
            @Param("endOfToday") LocalDateTime endOfToday);

    // Find upcoming interviews
    @Query("SELECT i FROM InterviewSchedule i WHERE " +
            "i.user = :user " +
            "AND i.scheduledDateTime > :now " +
            "AND i.status IN ('scheduled', 'confirmed') " +
            "ORDER BY i.scheduledDateTime ASC")
    List<InterviewSchedule> findUpcomingInterviews(
            @Param("user") User user,
            @Param("now") LocalDateTime now);
}
