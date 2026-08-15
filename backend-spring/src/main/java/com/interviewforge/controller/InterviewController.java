package com.interviewforge.controller;

import com.interviewforge.dto.*;
import com.interviewforge.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.interviewforge.client.AiServiceClient;
import java.util.List;

@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping
    public ResponseEntity<InterviewResponse> startInterview(
            @Valid @RequestBody StartInterviewRequest request) {
        InterviewResponse response = interviewService.startInterview(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<InterviewResponse>> getUserInterviews() {
        return ResponseEntity.ok(interviewService.getUserInterviews());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterviewResponse> getInterviewDetails(@PathVariable Long id) {
        return ResponseEntity.ok(interviewService.getInterviewDetails(id));
    }

    @PostMapping("/{interviewId}/questions/{questionId}/answers")
    public ResponseEntity<AnswerResponse> submitAnswer(
            @PathVariable Long interviewId,
            @PathVariable Long questionId,
            @Valid @RequestBody AnswerRequest request) {
        AnswerResponse response = interviewService.submitAnswer(interviewId, questionId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/{interviewId}/complete")
    public ResponseEntity<ReportResponse> completeInterview(@PathVariable Long interviewId) {
        ReportResponse response = interviewService.completeInterview(interviewId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{interviewId}/report")
    public ResponseEntity<ReportResponse> getInterviewReport(@PathVariable Long interviewId) {
        ReportResponse response = interviewService.getInterviewReport(interviewId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{interviewId}/questions/{questionId}/hint")
    public ResponseEntity<AiServiceClient.HintResponse> getHint(
            @PathVariable Long interviewId,
            @PathVariable Long questionId,
            @RequestBody List<AiServiceClient.ChatMessage> chatHistory) {
        AiServiceClient.HintResponse response = interviewService.getHint(interviewId, questionId, chatHistory);
        return ResponseEntity.ok(response);
    }
}
