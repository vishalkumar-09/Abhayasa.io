package com.interviewforge.service;

import com.interviewforge.dto.JobDescriptionRequest;
import com.interviewforge.dto.JobDescriptionResponse;
import com.interviewforge.entity.JobDescription;
import com.interviewforge.entity.User;
import com.interviewforge.exception.ResourceNotFoundException;
import com.interviewforge.exception.UnauthorizedException;
import com.interviewforge.repository.JobDescriptionRepository;
import com.interviewforge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobDescriptionRepository jobDescriptionRepository;
    private final UserRepository userRepository;
    private final com.interviewforge.repository.InterviewRepository interviewRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public JobDescriptionResponse createJobDescription(JobDescriptionRequest request) {
        User user = getAuthenticatedUser();

        JobDescription jobDescription = JobDescription.builder()
                .user(user)
                .title(request.getTitle())
                .companyName(request.getCompanyName())
                .rawText(request.getRawText())
                .skillsRequired(List.of()) // initialized as empty list
                .build();

        JobDescription savedJob = jobDescriptionRepository.save(jobDescription);
        return mapToResponse(savedJob);
    }

    @Transactional(readOnly = true)
    public List<JobDescriptionResponse> getUserJobDescriptions() {
        User user = getAuthenticatedUser();
        List<JobDescription> jobs = jobDescriptionRepository.findByUserId(user.getId());
        return jobs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteJobDescription(Long id) {
        User user = getAuthenticatedUser();

        JobDescription jobDescription = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job description not found with id: " + id));

        // Ownership check
        if (!Objects.equals(jobDescription.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You are not authorized to delete this job description.");
        }

        // Set job description reference to null on all interviews to avoid foreign key violations
        interviewRepository.setJobDescriptionToNull(id);

        jobDescriptionRepository.delete(jobDescription);
    }

    private JobDescriptionResponse mapToResponse(JobDescription job) {
        return JobDescriptionResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .companyName(job.getCompanyName())
                .rawText(job.getRawText())
                .skillsRequired(job.getSkillsRequired())
                .createdAt(job.getCreatedAt())
                .build();
    }
}
