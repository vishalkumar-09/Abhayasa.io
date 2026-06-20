package com.interviewforge.service;

import com.interviewforge.dto.ResumeResponse;
import com.interviewforge.entity.Resume;
import com.interviewforge.entity.User;
import com.interviewforge.exception.ResourceNotFoundException;
import com.interviewforge.exception.UnauthorizedException;
import com.interviewforge.repository.ResumeRepository;
import com.interviewforge.repository.UserRepository;
import com.interviewforge.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final FileStorageUtil fileStorageUtil;
    private final com.interviewforge.client.AiServiceClient aiServiceClient;
    private final com.interviewforge.repository.InterviewRepository interviewRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public ResumeResponse uploadResume(MultipartFile file) {
        User user = getAuthenticatedUser();
        
        // Save the file on disk
        String storedFileName = fileStorageUtil.storeFile(file);
        
        // Parse the resume using AI Service
        com.interviewforge.client.AiServiceClient.ResumeParsingResponse parsed = aiServiceClient.parseResume(file);
        
        // Save metadata in DB
        Resume resume = Resume.builder()
                .user(user)
                .fileName(file.getOriginalFilename())
                .filePath(storedFileName) // store the stored filename for retrieval
                .skills(parsed != null ? parsed.getSkills() : List.of())
                .parsedText(parsed != null ? parsed.getRawText() : "")
                .build();
        
        Resume savedResume = resumeRepository.save(resume);
        return mapToResponse(savedResume);
    }

    @Transactional(readOnly = true)
    public List<ResumeResponse> getUserResumes() {
        User user = getAuthenticatedUser();
        List<Resume> resumes = resumeRepository.findByUserId(user.getId());
        return resumes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteResume(Long id) {
        User user = getAuthenticatedUser();
        
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with id: " + id));
        
        // Ownership check
        if (!Objects.equals(resume.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You are not authorized to delete this resume.");
        }
        
        // Set resume reference to null on all interviews to avoid foreign key violations
        interviewRepository.setResumeToNull(id);
        
        // Delete file from disk
        fileStorageUtil.deleteFile(resume.getFilePath());
        
        // Delete record from database
        resumeRepository.delete(resume);
    }

    private ResumeResponse mapToResponse(Resume resume) {
        return ResumeResponse.builder()
                .id(resume.getId())
                .fileName(resume.getFileName())
                .filePath(resume.getFilePath())
                .skills(resume.getSkills())
                .createdAt(resume.getCreatedAt())
                .build();
    }
}
