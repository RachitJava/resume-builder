package com.resumebuilder.repository;

import com.resumebuilder.entity.AiSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiSettingsRepository extends JpaRepository<AiSettings, Long> {

    /**
     * Get the current AI settings (there should only be one row)
     */
    default Optional<AiSettings> getCurrentSettings() {
        return findAll().stream().findFirst();
    }
}
