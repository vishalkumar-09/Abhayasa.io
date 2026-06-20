package com.interviewforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDescriptionRequest {

    @NotBlank(message = "Job title is required")
    @Size(min = 2, max = 255, message = "Job title must be between 2 and 255 characters")
    private String title;

    private String companyName;

    @NotBlank(message = "Job requirements description is required")
    private String rawText;
}
