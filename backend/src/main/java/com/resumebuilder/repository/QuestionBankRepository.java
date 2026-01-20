package com.resumebuilder.repository;

import com.resumebuilder.entity.QuestionBank;
import com.resumebuilder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, String> {
    List<QuestionBank> findByUserAndIsActiveTrueOrderByCreatedAtDesc(User user);

    @org.springframework.data.jpa.repository.Query("SELECT q FROM QuestionBank q WHERE (q.isPublic = true OR q.user = :user) AND q.isActive = true ORDER BY q.createdAt DESC")
    List<QuestionBank> findVisibleBanks(User user);

    List<QuestionBank> findByUserAndCategoryAndIsActiveTrueOrderByCreatedAtDesc(User user, String category);

    // AI Syncing
    List<QuestionBank> findByCategory(String category);

    long countByUser(User user);

    // Admin: Find all active banks
    List<QuestionBank> findAllByIsActiveTrueOrderByCreatedAtDesc();
}
