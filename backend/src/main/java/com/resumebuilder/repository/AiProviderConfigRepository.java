package com.resumebuilder.repository;

import com.resumebuilder.entity.AiProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AiProviderConfigRepository extends JpaRepository<AiProviderConfig, Long> {
    Optional<AiProviderConfig> findByProviderName(String providerName);

    Optional<AiProviderConfig> findByActiveTrue();
}
