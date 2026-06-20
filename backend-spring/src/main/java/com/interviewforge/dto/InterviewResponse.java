package com.interviewforge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewResponse {
    private Long id;
    private String status;
    private Long resumeId;
    private Long jobDescriptionId;
    private List<QuestionResponse> questions;
    private LocalDateTime createdAt;
}
