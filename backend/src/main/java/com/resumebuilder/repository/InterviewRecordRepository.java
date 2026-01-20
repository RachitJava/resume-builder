package com.resumebuilder.repository;

import com.resumebuilder.entity.InterviewRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterviewRecordRepository extends JpaRepository<InterviewRecord, String> {
    List<InterviewRecord> findAllByOrderByTimestampDesc();
}
