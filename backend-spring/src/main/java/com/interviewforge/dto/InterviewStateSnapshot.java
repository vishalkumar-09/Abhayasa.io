package com.interviewforge.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Snapshot of the current interview progress state.
 * Serialised as JSON and stored in interview.interview_state column.
 * Returned to the frontend in every InterviewResponse and AnswerResponse.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class InterviewStateSnapshot {

    @Builder.Default
    private int primaryQuestionsAsked = 0;

    @Builder.Default
    private int followUpsAskedCurrentQuestion = 0;

    private List<String> competenciesEvaluated;

    private List<String> competenciesRequired;

    private LocalDateTime interviewStartTime;

    @Builder.Default
    private long elapsedMinutes = 0;

    @Builder.Default
    private String currentDifficulty = "MID";

    @Builder.Default
    private double rollingAvgScore = 0.0;

    @Builder.Default
    private boolean canEndEarly = false;

    @Builder.Default
    private boolean mustEnd = false;
}
