package com.interviewforge.service;

import com.interviewforge.client.AiServiceClient;
import com.interviewforge.dto.*;
import com.interviewforge.entity.*;
import com.interviewforge.exception.ResourceNotFoundException;
import com.interviewforge.exception.UnauthorizedException;
import com.interviewforge.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ReportRepository reportRepository;
    private final ResumeRepository resumeRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public InterviewResponse startInterview(StartInterviewRequest request) {
        User user = getAuthenticatedUser();

        Resume resume = resumeRepository.findById(request.getResumeId())
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with id: " + request.getResumeId()));
        
        if (!Objects.equals(resume.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You do not own the specified resume.");
        }

        JobDescription jobDescription = jobDescriptionRepository.findById(request.getJobDescriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Job description not found with id: " + request.getJobDescriptionId()));

        if (!Objects.equals(jobDescription.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You do not own the specified job description.");
        }

        // 1. Create a pending interview record
        Interview interview = Interview.builder()
                .user(user)
                .resume(resume)
                .jobDescription(jobDescription)
                .status(InterviewStatus.PENDING)
                .interviewType(request.getInterviewType() != null ? request.getInterviewType().toUpperCase() : "TECHNICAL")
                .questions(new ArrayList<>())
                .build();

        Interview savedInterview = interviewRepository.save(interview);

        List<AiServiceClient.GeneratedQuestion> generatedQuestions = 
                aiServiceClient.generateQuestions(
                        resume.getParsedText(), 
                        jobDescription.getRawText(),
                        jobDescription.getTitle(),
                        jobDescription.getCompanyName(),
                        savedInterview.getInterviewType()
                );

        // 3. Save questions mapped to the interview session
        List<Question> questions = generatedQuestions.stream().map(gq -> {
            QuestionDifficulty difficulty = QuestionDifficulty.MID;
            try {
                difficulty = QuestionDifficulty.valueOf(gq.getDifficulty().toUpperCase());
            } catch (Exception ignored) {}

            return Question.builder()
                    .interview(savedInterview)
                    .questionText(gq.getQuestionText())
                    .expectedKeywords(gq.getExpectedKeywords())
                    .difficulty(difficulty)
                    .category(gq.getCategory() != null ? gq.getCategory().toUpperCase() : "TECHNICAL")
                    .build();
        }).collect(Collectors.toList());

        List<Question> savedQuestions = questionRepository.saveAll(questions);
        savedInterview.getQuestions().addAll(savedQuestions);

        // 4. Update status to IN_PROGRESS
        savedInterview.setStatus(InterviewStatus.IN_PROGRESS);

        return mapToResponse(savedInterview);
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> getUserInterviews() {
        User user = getAuthenticatedUser();
        List<Interview> interviews = interviewRepository.findByUserId(user.getId());
        return interviews.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InterviewResponse getInterviewDetails(Long id) {
        User user = getAuthenticatedUser();

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with id: " + id));

        if (!Objects.equals(interview.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You are not authorized to access this interview session.");
        }

        return mapToResponse(interview);
    }

    @Transactional
    public AnswerResponse submitAnswer(Long interviewId, Long questionId, AnswerRequest request) {
        User user = getAuthenticatedUser();

        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with id: " + interviewId));

        if (!Objects.equals(interview.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You are not authorized to submit answers for this interview session.");
        }

        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            throw new IllegalStateException("Cannot submit answers to an already completed interview.");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));

        if (!Objects.equals(question.getInterview().getId(), interview.getId())) {
            throw new ResourceNotFoundException("The specified question does not belong to this interview session.");
        }

        // Call the AI client wrapper to evaluate candidate response
        AiServiceClient.AnswerEvaluationResponse evaluation = aiServiceClient.evaluateAnswer(
                question.getQuestionText(),
                question.getExpectedKeywords(),
                request.getAnswerText()
        );

        // Check for existing answer to overwrite or update
        Optional<Answer> existingAnswer = answerRepository.findByQuestionId(questionId);
        Answer answer;
        if (existingAnswer.isPresent()) {
            answer = existingAnswer.get();
            answer.setAnswerText(request.getAnswerText());
            answer.setAudioPath(request.getAudioPath());
            answer.setEvaluationScore(evaluation.getScore());
            answer.setEvaluationFeedback(evaluation.getFeedback());
        } else {
            answer = Answer.builder()
                    .question(question)
                    .answerText(request.getAnswerText())
                    .audioPath(request.getAudioPath())
                    .evaluationScore(evaluation.getScore())
                    .evaluationFeedback(evaluation.getFeedback())
                    .build();
        }

        Answer savedAnswer = answerRepository.save(answer);
        return mapToAnswerResponse(savedAnswer);
    }

    @Transactional
    public ReportResponse completeInterview(Long interviewId) {
        User user = getAuthenticatedUser();

        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with id: " + interviewId));

        if (!Objects.equals(interview.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You are not authorized to complete this interview session.");
        }

        // Idempotence check
        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            Report report = reportRepository.findByInterviewId(interviewId)
                    .orElseThrow(() -> new ResourceNotFoundException("Completed interview report is missing."));
            return mapToReportResponse(report);
        }

        // Fetch questions and answers
        List<Question> questions = interview.getQuestions();
        if (questions == null || questions.isEmpty()) {
            throw new IllegalStateException("Cannot complete an interview session with no questions.");
        }

        // Gather all answer details for report generation
        List<AiServiceClient.ReportGenerationRequest.AnswerDetails> answerDetailsList = questions.stream().map(q -> {
            Answer ans = q.getAnswer();
            String ansText = ans != null ? ans.getAnswerText() : "[No Answer Provided]";
            Integer score = ans != null ? ans.getEvaluationScore() : 0;
            String feedback = ans != null ? ans.getEvaluationFeedback() : "Question was not answered by the candidate.";
            
            return AiServiceClient.ReportGenerationRequest.AnswerDetails.builder()
                    .questionText(q.getQuestionText())
                    .answerText(ansText)
                    .expectedKeywords(q.getExpectedKeywords())
                    .score(score)
                    .feedback(feedback)
                    .build();
        }).collect(Collectors.toList());

        // Invoke AI service to generate aggregated report summary
        AiServiceClient.ReportGenerationResponse aiReport = aiServiceClient.generateReport(answerDetailsList);

        // Update Interview state
        interview.setStatus(InterviewStatus.COMPLETED);
        interviewRepository.save(interview);

        // Save report metadata
        Report report = Report.builder()
                .interview(interview)
                .overallScore(aiReport.getOverallScore())
                .summary(aiReport.getSummary())
                .strengths(aiReport.getStrengths())
                .weaknesses(aiReport.getWeaknesses())
                .recommendations(aiReport.getRecommendations())
                .build();

        Report savedReport = reportRepository.save(report);
        return mapToReportResponse(savedReport);
    }

    @Transactional(readOnly = true)
    public ReportResponse getInterviewReport(Long interviewId) {
        User user = getAuthenticatedUser();

        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with id: " + interviewId));

        if (!Objects.equals(interview.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You are not authorized to access this interview report.");
        }

        if (interview.getStatus() != InterviewStatus.COMPLETED) {
            throw new IllegalStateException("The interview session is not yet completed.");
        }

        Report report = reportRepository.findByInterviewId(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found for interview session id: " + interviewId));

        return mapToReportResponse(report);
    }

    // =========================================================================
    // MAPPER UTILITIES
    // =========================================================================

    private InterviewResponse mapToResponse(Interview interview) {
        List<QuestionResponse> questionDtos = List.of();
        if (interview.getQuestions() != null) {
            questionDtos = interview.getQuestions().stream()
                    .map(q -> QuestionResponse.builder()
                            .id(q.getId())
                            .questionText(q.getQuestionText())
                            .difficulty(q.getDifficulty().name())
                            .answered(q.getAnswer() != null)
                            .category(q.getCategory() != null ? q.getCategory() : "TECHNICAL")
                            .answer(q.getAnswer() != null ? mapToAnswerResponse(q.getAnswer()) : null)
                            .build())
                    .collect(Collectors.toList());
        }

        return InterviewResponse.builder()
                .id(interview.getId())
                .status(interview.getStatus().name())
                .resumeId(interview.getResume() != null ? interview.getResume().getId() : null)
                .jobDescriptionId(interview.getJobDescription() != null ? interview.getJobDescription().getId() : null)
                .questions(questionDtos)
                .interviewType(interview.getInterviewType())
                .createdAt(interview.getCreatedAt())
                .build();
    }

    private AnswerResponse mapToAnswerResponse(Answer answer) {
        return AnswerResponse.builder()
                .id(answer.getId())
                .questionId(answer.getQuestion().getId())
                .answerText(answer.getAnswerText())
                .audioPath(answer.getAudioPath())
                .evaluationScore(answer.getEvaluationScore())
                .evaluationFeedback(answer.getEvaluationFeedback())
                .build();
    }

    private ReportResponse mapToReportResponse(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .interviewId(report.getInterview().getId())
                .overallScore(report.getOverallScore())
                .summary(report.getSummary())
                .strengths(report.getStrengths())
                .weaknesses(report.getWeaknesses())
                .recommendations(report.getRecommendations())
                .createdAt(report.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public AiServiceClient.HintResponse getHint(Long interviewId, Long questionId, List<AiServiceClient.ChatMessage> chatHistory) {
        User user = getAuthenticatedUser();
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found"));
        if (!Objects.equals(interview.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You do not own this interview.");
        }
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        return aiServiceClient.getHint(question.getQuestionText(), question.getExpectedKeywords(), chatHistory);
    }
}
