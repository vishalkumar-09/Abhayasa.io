package com.interviewforge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResponse {
    private Long id;
    private Long questionId;
    private String answerText;
    private String audioPath;
    private Integer evaluationScore;
    private String evaluationFeedback;
    private Integer technicalScore;
    private Integer communicationScore;
    private Integer depthScore;
    private Integer completenessScore;
    
    private String answerStrength;
    private List<String> missedConcepts;
}
