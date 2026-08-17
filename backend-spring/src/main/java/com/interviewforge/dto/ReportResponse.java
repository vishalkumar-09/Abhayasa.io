package com.interviewforge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private Long id;
    private Long interviewId;
    private String roleTitle;
    private String categoryName;
    private BigDecimal overallScore;
    private String summary;
    private List<String> strengths;
    private List<String> weaknesses;
    private String recommendations;
    private List<QuestionResponse> questions;
    private LocalDateTime createdAt;
    
    private String readiness;
    private Integer readinessScore;
    private List<Map<String, Object>> competencyBreakdown;
    private Map<String, Object> roleAlignment;
    private List<String> nextInterviewPlan;
    private List<String> missingConcepts;
}
