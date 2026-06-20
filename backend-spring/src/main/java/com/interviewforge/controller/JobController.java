package com.interviewforge.controller;

import com.interviewforge.dto.JobDescriptionRequest;
import com.interviewforge.dto.JobDescriptionResponse;
import com.interviewforge.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/job-descriptions")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @PostMapping
    public ResponseEntity<JobDescriptionResponse> createJobDescription(
            @Valid @RequestBody JobDescriptionRequest request) {
        JobDescriptionResponse response = jobService.createJobDescription(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<JobDescriptionResponse>> getUserJobDescriptions() {
        return ResponseEntity.ok(jobService.getUserJobDescriptions());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJobDescription(@PathVariable Long id) {
        jobService.deleteJobDescription(id);
        return ResponseEntity.noContent().build();
    }
}
