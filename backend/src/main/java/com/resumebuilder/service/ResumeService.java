package com.resumebuilder.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumebuilder.dto.ResumeDTO;
import com.resumebuilder.entity.Resume;
import com.resumebuilder.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository repository;
    private final ObjectMapper objectMapper;

    public ResumeDTO create(ResumeDTO dto, String userId) {
        Resume resume = toEntity(dto);
        resume.setUserId(userId);
        resume = repository.save(resume);
        return toDTO(resume);
    }

    public ResumeDTO update(String id, ResumeDTO dto, String userId) {
        Resume existing = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Resume not found or access denied: " + id));

        updateEntity(existing, dto);
        existing = repository.save(existing);
        return toDTO(existing);
    }

    public ResumeDTO getById(String id, String userId) {
        Resume resume = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Resume not found or access denied: " + id));
        return toDTO(resume);
    }

    public List<ResumeDTO> getAllByUser(String userId) {
        return repository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // Keep this for backward compatibility (internal use only)
    public List<ResumeDTO> getAll() {
        return repository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public void delete(String id, String userId) {
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new RuntimeException("Resume not found or access denied: " + id);
        }
        repository.deleteById(id);
    }

    public Resume getEntityById(String id, String userId) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Resume not found or access denied: " + id));
    }
    
    // Internal method for PDF service
    public Resume getEntityById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found: " + id));
    }

    private Resume toEntity(ResumeDTO dto) {
        Resume resume = new Resume();
        updateEntity(resume, dto);
        return resume;
    }

    private void updateEntity(Resume resume, ResumeDTO dto) {
        resume.setFullName(dto.getFullName());
        resume.setEmail(dto.getEmail());
        resume.setPhone(dto.getPhone());
        resume.setLocation(dto.getLocation());
        resume.setLinkedIn(dto.getLinkedIn());
        resume.setGithub(dto.getGithub());
        resume.setWebsite(dto.getWebsite());
        resume.setSummary(dto.getSummary());
        resume.setTemplate(dto.getTemplate() != null ? dto.getTemplate() : "modern");

        try {
            resume.setExperience(objectMapper.writeValueAsString(dto.getExperience()));
            resume.setEducation(objectMapper.writeValueAsString(dto.getEducation()));
            resume.setSkills(objectMapper.writeValueAsString(dto.getSkills()));
            resume.setProjects(objectMapper.writeValueAsString(dto.getProjects()));
            resume.setCertifications(objectMapper.writeValueAsString(dto.getCertifications()));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing resume data", e);
        }
    }

    private ResumeDTO toDTO(Resume resume) {
        ResumeDTO dto = new ResumeDTO();
        dto.setId(resume.getId());
        dto.setFullName(resume.getFullName());
        dto.setEmail(resume.getEmail());
        dto.setPhone(resume.getPhone());
        dto.setLocation(resume.getLocation());
        dto.setLinkedIn(resume.getLinkedIn());
        dto.setGithub(resume.getGithub());
        dto.setWebsite(resume.getWebsite());
        dto.setSummary(resume.getSummary());
        dto.setTemplate(resume.getTemplate());

        try {
            dto.setExperience(parseList(resume.getExperience(), ResumeDTO.Experience.class));
            dto.setEducation(parseList(resume.getEducation(), ResumeDTO.Education.class));
            dto.setSkills(parseStringList(resume.getSkills()));
            dto.setProjects(parseList(resume.getProjects(), ResumeDTO.Project.class));
            dto.setCertifications(parseStringList(resume.getCertifications()));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error deserializing resume data", e);
        }

        return dto;
    }

    private <T> List<T> parseList(String json, Class<T> clazz) throws JsonProcessingException {
        if (json == null || json.equals("null")) return List.of();
        return objectMapper.readValue(json,
                objectMapper.getTypeFactory().constructCollectionType(List.class, clazz));
    }

    private List<String> parseStringList(String json) throws JsonProcessingException {
        if (json == null || json.equals("null")) return List.of();
        return objectMapper.readValue(json,
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
    }
}

