package com.resumebuilder.repository;

import com.resumebuilder.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, String> {
    
    List<ApiKey> findByProviderAndActiveOrderByPriorityAsc(String provider, boolean active);
    
    List<ApiKey> findAllByOrderByPriorityAsc();
    
    Optional<ApiKey> findFirstByProviderAndActiveAndConsecutiveErrorsLessThanOrderByPriorityAsc(
            String provider, boolean active, int maxErrors);
}
