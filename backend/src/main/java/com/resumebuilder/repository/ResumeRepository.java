package com.resumebuilder.repository;

import com.resumebuilder.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, String> {
    List<Resume> findAllByOrderByUpdatedAtDesc();
    
    // Find resumes by user
    List<Resume> findByUserIdOrderByUpdatedAtDesc(String userId);
    
    // Find resume by id and user (for security)
    Optional<Resume> findByIdAndUserId(String id, String userId);
    
    // Check if resume belongs to user
    boolean existsByIdAndUserId(String id, String userId);
}

