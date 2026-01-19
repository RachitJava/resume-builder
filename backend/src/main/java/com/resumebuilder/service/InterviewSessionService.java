package com.resumebuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumebuilder.entity.InterviewSession;
import com.resumebuilder.entity.User;
import com.resumebuilder.repository.InterviewSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class InterviewSessionService {

    @Autowired
    private InterviewSessionRepository repository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public InterviewSession saveSession(User user, Map<String, Object> sessionData) {
        try {
            InterviewSession session = new InterviewSession();
            session.setUser(user);
            session.setRole((String) sessionData.get("role"));

            // Serialize messages list to JSON string
            String transcriptJson = objectMapper.writeValueAsString(sessionData.get("messages"));
            session.setTranscript(transcriptJson);

            session.setFeedbackSummary((String) sessionData.get("feedback"));

            return repository.save(session);
        } catch (Exception e) {
            throw new RuntimeException("Error saving interview session: " + e.getMessage(), e);
        }
    }

    public List<InterviewSession> getUserSessions(User user) {
        return repository.findByUserOrderByCreatedAtDesc(user);
    }

    public void deleteSession(String id, User user) {
        InterviewSession session = repository.findById(id).orElse(null);
        if (session != null && session.getUser().getId().equals(user.getId())) {
            repository.delete(session);
        }
    }
}
