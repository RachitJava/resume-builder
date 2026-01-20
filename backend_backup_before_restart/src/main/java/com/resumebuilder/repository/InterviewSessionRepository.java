package com.resumebuilder.repository;

import com.resumebuilder.entity.InterviewSession;
import com.resumebuilder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, String> {
    List<InterviewSession> findByUserOrderByCreatedAtDesc(User user);
}
