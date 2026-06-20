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
public class JobDescriptionResponse {
    private Long id;
    private String title;
    private String companyName;
    private String rawText;
    private List<String> skillsRequired;
    private LocalDateTime createdAt;
}
