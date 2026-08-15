package com.interviewforge.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartInterviewRequest {

    @NotNull(message = "Resume identifier is required")
    private Long resumeId;

    @NotNull(message = "Job description identifier is required")
    private Long jobDescriptionId;

    private String interviewType = "TECHNICAL";
}
