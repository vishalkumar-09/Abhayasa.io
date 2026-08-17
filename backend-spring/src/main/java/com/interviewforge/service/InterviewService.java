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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.interviewforge.dto.InterviewStateSnapshot;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

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

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(InterviewService.class);

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

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

        Map<String, Object> resumeStructured = new HashMap<>();
        if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
            resumeStructured.put("skills", resume.getSkills());
        }

        List<AiServiceClient.GeneratedQuestion> generatedQuestions = 
                aiServiceClient.generateQuestions(
                        resume.getParsedText(), 
                        jobDescription.getRawText(),
                        jobDescription.getTitle(),
                        jobDescription.getCompanyName(),
                        savedInterview.getInterviewType(),
                        List.of(),
                        resumeStructured,
                        "FIRST"
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
        savedInterview.setInterviewStartTime(LocalDateTime.now());
        savedInterview.setPrimaryQuestionsAsked(0);
        savedInterview.setFollowUpsCurrentQuestion(0);

        InterviewStateSnapshot initialState = InterviewStateSnapshot.builder()
                .primaryQuestionsAsked(0)
                .followUpsAskedCurrentQuestion(0)
                .competenciesEvaluated(List.of())
                .competenciesRequired(List.of("Core Skills", "Technical Concepts", "System Design", "DSA", "Resume Projects"))
                .interviewStartTime(LocalDateTime.now())
                .elapsedMinutes(0)
                .currentDifficulty(savedInterview.getInterviewType() != null ? "MID" : "MID")
                .rollingAvgScore(0.0)
                .canEndEarly(false)
                .mustEnd(false)
                .build();
        try {
            savedInterview.setInterviewState(objectMapper.writeValueAsString(initialState));
        } catch (Exception e) {
            logger.warn("Could not serialise initial interview state: {}", e.getMessage());
        }

        return mapToResponse(savedInterview);
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> getUserInterviews() {
        User user = getAuthenticatedUser();
        List<Interview> interviews = interviewRepository.findByUserIdOrderByIdDesc(user.getId());
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

        answer.setTechnicalScore(evaluation.getTechnicalScore());
        answer.setCommunicationScore(evaluation.getCommunicationScore());
        answer.setDepthScore(evaluation.getDepthScore());
        answer.setCompletenessScore(evaluation.getCompletenessScore());

        Answer savedAnswer = answerRepository.save(answer);
        
        updateInterviewState(interview, question, evaluation);
        
        AnswerResponse resp = mapToAnswerResponse(savedAnswer);
        resp.setAnswerStrength(evaluation.getAnswerStrength());
        resp.setMissedConcepts(evaluation.getMissedConcepts());
        return resp;
    }

    private void updateInterviewState(Interview interview, Question question, AiServiceClient.AnswerEvaluationResponse evaluation) {
        try {
            InterviewStateSnapshot state;
            if (interview.getInterviewState() != null && !interview.getInterviewState().isBlank()) {
                state = objectMapper.readValue(interview.getInterviewState(), InterviewStateSnapshot.class);
            } else {
                state = InterviewStateSnapshot.builder()
                        .competenciesEvaluated(new java.util.ArrayList<>())
                        .competenciesRequired(List.of("Core Skills", "Technical Concepts", "System Design", "DSA", "Resume Projects"))
                        .interviewStartTime(interview.getInterviewStartTime() != null ? interview.getInterviewStartTime() : LocalDateTime.now())
                        .currentDifficulty("MID")
                        .build();
            }

            boolean isPrimaryQuestion = true;

            if (isPrimaryQuestion) {
                int newCount = (state.getPrimaryQuestionsAsked() + 1);
                state = InterviewStateSnapshot.builder()
                        .primaryQuestionsAsked(newCount)
                        .followUpsAskedCurrentQuestion(0)
                        .competenciesEvaluated(state.getCompetenciesEvaluated())
                        .competenciesRequired(state.getCompetenciesRequired())
                        .interviewStartTime(state.getInterviewStartTime())
                        .currentDifficulty(adaptDifficulty(state, evaluation))
                        .rollingAvgScore(computeRollingAvg(interview, evaluation))
                        .canEndEarly(newCount >= 1)
                        .mustEnd(newCount >= 10 || isTimeExpired(state))
                        .elapsedMinutes(computeElapsed(state))
                        .build();

                interview.setPrimaryQuestionsAsked(newCount);
                interview.setFollowUpsCurrentQuestion(0);
            }

            interview.setInterviewState(objectMapper.writeValueAsString(state));
            interviewRepository.save(interview);
        } catch (Exception e) {
            logger.warn("Could not update interview state: {}", e.getMessage());
        }
    }

    private String adaptDifficulty(InterviewStateSnapshot state, AiServiceClient.AnswerEvaluationResponse eval) {
        double avg = state.getRollingAvgScore();
        if (eval.getScore() != null && avg > 0) {
            double updated = (avg * 0.7) + (eval.getScore() * 0.3);
            if (updated >= 8.0) return "SENIOR";
            if (updated <= 4.0) return "JUNIOR";
        }
        return state.getCurrentDifficulty() != null ? state.getCurrentDifficulty() : "MID";
    }

    private double computeRollingAvg(Interview interview, AiServiceClient.AnswerEvaluationResponse eval) {
        List<Question> qs = interview.getQuestions();
        if (qs == null) return eval.getScore() != null ? eval.getScore() : 0.0;
        List<Integer> recentScores = qs.stream()
                .filter(q -> q.getAnswer() != null && q.getAnswer().getEvaluationScore() != null)
                .map(q -> q.getAnswer().getEvaluationScore())
                .sorted(java.util.Comparator.reverseOrder())
                .limit(5)
                .collect(Collectors.toList());
        if (recentScores.isEmpty()) return eval.getScore() != null ? eval.getScore() : 0.0;
        return recentScores.stream().mapToInt(Integer::intValue).average().orElse(0.0);
    }

    private boolean isTimeExpired(InterviewStateSnapshot state) {
        if (state.getInterviewStartTime() == null) return false;
        return Duration.between(state.getInterviewStartTime(), LocalDateTime.now()).toMinutes() >= 45;
    }

    private long computeElapsed(InterviewStateSnapshot state) {
        if (state.getInterviewStartTime() == null) return 0;
        return Duration.between(state.getInterviewStartTime(), LocalDateTime.now()).toMinutes();
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
                    .category(q.getCategory())
                    .competency(q.getCategory())
                    .build();
        }).collect(Collectors.toList());

        String jobTitle = interview.getJobDescription() != null ? interview.getJobDescription().getTitle() : null;
        if (jobTitle == null || jobTitle.isBlank()) {
            jobTitle = interview.getInterviewType() != null ? (interview.getInterviewType() + " Role") : "Software Engineer";
        }
        String companyName = interview.getJobDescription() != null ? interview.getJobDescription().getCompanyName() : "Target Company";
        List<String> resumeSkills = interview.getResume() != null ? interview.getResume().getSkills() : List.of();
        
        String difficulty = "MID";
        if (interview.getInterviewState() != null && !interview.getInterviewState().isBlank()) {
            try {
                InterviewStateSnapshot state = objectMapper.readValue(interview.getInterviewState(), InterviewStateSnapshot.class);
                if (state.getCurrentDifficulty() != null) {
                    difficulty = state.getCurrentDifficulty();
                }
            } catch (Exception ignored) {}
        }

        AiServiceClient.ReportGenerationResponse aiReport = aiServiceClient.generateReport(
            answerDetailsList,
            jobTitle,
            companyName,
            interview.getInterviewType(),
            difficulty,
            resumeSkills
        );

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
                .missingConcepts(aiReport.getMissingConcepts())
                .nextInterviewPlan(aiReport.getNextInterviewPlan() != null ? aiReport.getNextInterviewPlan() : aiReport.getImprovementRoadmap())
                .recommendations(aiReport.getRecommendations())
                .readiness(aiReport.getReadiness())
                .readinessScore(aiReport.getReadinessScore())
                .build();

        if (aiReport.getCompetencyBreakdown() != null && !aiReport.getCompetencyBreakdown().isEmpty()) {
            try {
                report.setCompetencyBreakdown(objectMapper.writeValueAsString(aiReport.getCompetencyBreakdown()));
            } catch (Exception e) {
                logger.warn("Could not serialise competency breakdown: {}", e.getMessage());
            }
        }

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

        InterviewStateSnapshot stateSnapshot = null;
        if (interview.getInterviewState() != null && !interview.getInterviewState().isBlank()) {
            try {
                stateSnapshot = objectMapper.readValue(interview.getInterviewState(), InterviewStateSnapshot.class);
            } catch (Exception e) {
                logger.warn("Could not parse interview state: {}", e.getMessage());
            }
        }

        java.math.BigDecimal overallScore = null;
        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            overallScore = reportRepository.findByInterviewId(interview.getId())
                    .map(Report::getOverallScore)
                    .orElse(null);
        }

        return InterviewResponse.builder()
                .id(interview.getId())
                .status(interview.getStatus().name())
                .resumeId(interview.getResume() != null ? interview.getResume().getId() : null)
                .jobDescriptionId(interview.getJobDescription() != null ? interview.getJobDescription().getId() : null)
                .questions(questionDtos)
                .interviewType(interview.getInterviewType())
                .createdAt(interview.getCreatedAt())
                .overallScore(overallScore)
                .interviewState(stateSnapshot)
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
        Interview interview = report.getInterview();
        List<QuestionResponse> questionDtos = List.of();
        if (interview != null && interview.getQuestions() != null) {
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

        List<Map<String, Object>> competencyBreakdown = List.of();
        if (report.getCompetencyBreakdown() != null && !report.getCompetencyBreakdown().isBlank()) {
            try {
                competencyBreakdown = objectMapper.readValue(
                    report.getCompetencyBreakdown(),
                    new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {}
                );
            } catch (Exception e) {
                logger.warn("Could not deserialise competency breakdown: {}", e.getMessage());
            }
        }

        String roleTitle = "Software Engineer";
        String companyName = "Target Role";
        String difficulty = "MID";
        Long durationMinutes = 45L;

        if (interview != null) {
            if (interview.getJobDescription() != null) {
                if (interview.getJobDescription().getTitle() != null && !interview.getJobDescription().getTitle().isBlank()) {
                    roleTitle = interview.getJobDescription().getTitle();
                }
                if (interview.getJobDescription().getCompanyName() != null && !interview.getJobDescription().getCompanyName().isBlank()) {
                    companyName = interview.getJobDescription().getCompanyName();
                }
            } else if (interview.getInterviewType() != null) {
                roleTitle = interview.getInterviewType() + " Candidate";
            }

            if (interview.getInterviewState() != null && !interview.getInterviewState().isBlank()) {
                try {
                    InterviewStateSnapshot state = objectMapper.readValue(interview.getInterviewState(), InterviewStateSnapshot.class);
                    if (state.getCurrentDifficulty() != null) {
                        difficulty = state.getCurrentDifficulty();
                    }
                    if (state.getElapsedMinutes() > 0) {
                        durationMinutes = state.getElapsedMinutes();
                    }
                } catch (Exception ignored) {}
            }
        }

        return ReportResponse.builder()
                .id(report.getId())
                .interviewId(interview != null ? interview.getId() : null)
                .roleTitle(roleTitle)
                .companyName(companyName)
                .categoryName(interview != null ? interview.getInterviewType() : "TECHNICAL")
                .difficulty(difficulty)
                .experienceLevel("Standard Level")
                .durationMinutes(durationMinutes)
                .overallScore(report.getOverallScore())
                .summary(report.getSummary())
                .strengths(report.getStrengths())
                .weaknesses(report.getWeaknesses())
                .missingConcepts(report.getMissingConcepts())
                .nextInterviewPlan(report.getNextInterviewPlan())
                .recommendations(report.getRecommendations())
                .questions(questionDtos)
                .createdAt(report.getCreatedAt())
                .readiness(report.getReadiness())
                .readinessScore(report.getReadinessScore())
                .competencyBreakdown(competencyBreakdown)
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

    public FollowUpResponse generateFollowUp(Long interviewId, Long questionId, FollowUpRequest request) {
        User user = getAuthenticatedUser();
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with id: " + interviewId));
        if (!Objects.equals(interview.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You are not authorized to access this interview session.");
        }
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
        
        int historySize = (request.getHistory() != null) ? request.getHistory().size() : 0;
        if (historySize >= 3) {
            return new FollowUpResponse(null);
        }
        
        interview.setFollowUpsCurrentQuestion(historySize + 1);
        interviewRepository.save(interview);
        
        String currentQuestionContext = (request.getHistory() != null && !request.getHistory().isEmpty())
                ? request.getHistory().get(request.getHistory().size() - 1)
                : question.getQuestionText();

        String followupText = aiServiceClient.generateFollowUp(
                currentQuestionContext,
                request.getAnswerText(),
                request.getHistory()
        );
        return new FollowUpResponse(followupText);
    }

    @Transactional
    public void deleteInterview(Long interviewId) {
        User user = getAuthenticatedUser();
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with id: " + interviewId));
        if (!Objects.equals(interview.getUser().getId(), user.getId())) {
            throw new UnauthorizedException("You are not authorized to delete this interview session.");
        }
        interviewRepository.delete(interview);
    }

    public AiServiceClient.TranscribeResponse transcribeAudio(org.springframework.web.multipart.MultipartFile file) {
        return aiServiceClient.transcribeAudio(file);
    }
}
