package com.interviewforge.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AiServiceClient {

    private final RestClient restClient;

    public AiServiceClient(@Value("${app.ai-service.url}") String aiServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory())
                .build();
    }

    // =========================================================================
    // DTO REQUESTS & RESPONSES FOR AI SERVICE COMMUNICATION
    // =========================================================================

    @Data
    public static class ResumeParsingResponse {
        @com.fasterxml.jackson.annotation.JsonProperty("raw_text")
        private String rawText;
        private List<String> skills;
    }

    @Data
    public static class QuestionGenerationRequest {
        private String resumeText;
        private String jobDescriptionText;
        private String jobTitle;
        private String companyName;
        private String interviewType;
    }

    @Data
    public static class QuestionGenerationResponse {
        private List<GeneratedQuestion> questions;
    }

    @Data
    public static class GeneratedQuestion {
        @com.fasterxml.jackson.annotation.JsonProperty("question_text")
        private String questionText;
        
        private String difficulty;
        
        private String category;
        
        @com.fasterxml.jackson.annotation.JsonProperty("expected_keywords")
        private List<String> expectedKeywords;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AnswerEvaluationRequest {
        private String questionText;
        private List<String> expectedKeywords;
        private String answerText;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerEvaluationResponse {
        private Integer score;
        private String feedback;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReportGenerationRequest {
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class AnswerDetails {
            private String questionText;
            private String answerText;
            private List<String> expectedKeywords;
            private Integer score;
            private String feedback;
        }
        private List<AnswerDetails> answers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class ReportGenerationResponse {
        private BigDecimal overallScore;
        private String summary;
        private List<String> strengths;
        private List<String> weaknesses;
        private List<String> missingConcepts;
        private List<String> improvementRoadmap;
        private String recommendations;
    }

    // =========================================================================
    // SERVICE CALL METHODS
    // =========================================================================

    public ResumeParsingResponse parseResume(org.springframework.web.multipart.MultipartFile file) {
        try {
            org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            body.add("file", file.getResource());

            return restClient.post()
                    .uri("/api/v1/resumes/parse")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(ResumeParsingResponse.class);
        } catch (Exception ex) {
            // Local fallback in case FastAPI is offline
            ResumeParsingResponse mock = new ResumeParsingResponse();
            mock.setRawText("Mock parsed resume content for: " + file.getOriginalFilename());
            mock.setSkills(List.of("Java", "Spring Boot", "SQL"));
            return mock;
        }
    }

    public List<GeneratedQuestion> generateQuestions(String resumeText, String jobDescriptionText, String jobTitle, String companyName, String interviewType) {
        QuestionGenerationRequest requestBody = new QuestionGenerationRequest();
        requestBody.setResumeText(resumeText != null && !resumeText.isBlank() ? resumeText : "Generic Resume Text");
        requestBody.setJobDescriptionText(jobDescriptionText != null && !jobDescriptionText.isBlank() ? jobDescriptionText : "Generic Job Description");
        requestBody.setJobTitle(jobTitle != null && !jobTitle.isBlank() ? jobTitle : "Software Engineer");
        requestBody.setCompanyName(companyName != null && !companyName.isBlank() ? companyName : "the target company");
        requestBody.setInterviewType(interviewType != null ? interviewType : "TECHNICAL");

        try {
            QuestionGenerationResponse response = restClient.post()
                    .uri("/api/v1/generate-questions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(QuestionGenerationResponse.class);
            return response != null ? response.getQuestions() : List.of();
        } catch (Exception ex) {
            // Fallback mock questions in case FastAPI is offline
            return List.of(
                createMockQuestion("Can you describe a challenging project you worked on and how you resolved technical obstacles?", "MID", List.of("challenge", "problem solving", "resolution")),
                createMockQuestion("How do you handle state management, caching, and rendering optimizations in Next.js?", "SENIOR", List.of("Next.js", "state", "optimization")),
                createMockQuestion("What is the difference between optimistic locking and pessimistic locking in Spring Data JPA/Hibernate?", "MID", List.of("JPA", "locking", "Hibernate"))
            );
        }
    }

    public AnswerEvaluationResponse evaluateAnswer(String questionText, List<String> expectedKeywords, String answerText) {
        AnswerEvaluationRequest requestBody = new AnswerEvaluationRequest(questionText, expectedKeywords, answerText);
        try {
            return restClient.post()
                    .uri("/api/v1/evaluate-answer")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(AnswerEvaluationResponse.class);
        } catch (Exception ex) {
            // Local fallback mock evaluation
            int score = calculateMockScore(answerText, expectedKeywords);
            String feedback = String.format(
                "Good attempt. You demonstrated knowledge of key concepts. To improve, discuss details around the requested keywords: %s.",
                String.join(", ", expectedKeywords)
            );
            return AnswerEvaluationResponse.builder().score(score).feedback(feedback).build();
        }
    }

    public ReportGenerationResponse generateReport(List<ReportGenerationRequest.AnswerDetails> answers) {
        ReportGenerationRequest requestBody = new ReportGenerationRequest(answers);
        try {
            return restClient.post()
                    .uri("/api/v1/generate-report")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(ReportGenerationResponse.class);
        } catch (Exception ex) {
            // Local fallback mock report summary
            double average = answers.isEmpty() ? 0.0 : answers.stream().mapToInt(a -> a.getScore() != null ? a.getScore() : 6).average().orElse(0.0);
            BigDecimal overallScore = BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP);
            
            return ReportGenerationResponse.builder()
                    .overallScore(overallScore)
                    .summary("The candidate demonstrated solid technical and architectural knowledge across key domains. Coding answers were structure-compliant.")
                    .strengths(List.of("Good understanding of relational database locking behaviors", "Familiar with Next.js rendering optimizations"))
                    .weaknesses(List.of("Details around Spring MVC request dispatching servlet could be deeper"))
                    .recommendations("Review core Servlet lifecycle processes and practice dynamic programming algorithm patterns.")
                    .build();
        }
    }

    public HintResponse getHint(String questionText, List<String> expectedKeywords, List<ChatMessage> chatHistory) {
        HintRequest requestBody = new HintRequest(questionText, expectedKeywords, chatHistory);
        try {
            return restClient.post()
                    .uri("/api/v1/get-hint")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(HintResponse.class);
        } catch (Exception ex) {
            return new HintResponse("Consider how you would structure the core logic using expected concepts: " + String.join(", ", expectedKeywords));
        }
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HintRequest {
        private String question_text;
        private List<String> expected_keywords;
        private List<ChatMessage> chat_history;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HintResponse {
        private String hint;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ChatMessage {
        private String role;
        private String text;
    }

    // =========================================================================
    // PRIVATE MOCK UTILS
    // =========================================================================

    private GeneratedQuestion createMockQuestion(String text, String diff, List<String> kw) {
        GeneratedQuestion q = new GeneratedQuestion();
        q.setQuestionText(text);
        q.setDifficulty(diff);
        q.setExpectedKeywords(kw);
        return q;
    }

    private int calculateMockScore(String answer, List<String> keywords) {
        if (answer == null || answer.isBlank()) return 1;
        String lowerAns = answer.toLowerCase();
        int matched = 0;
        if (keywords != null) {
            for (String kw : keywords) {
                if (lowerAns.contains(kw.toLowerCase())) {
                    matched++;
                }
            }
        }
        if (matched == 0) return 5;
        if (matched == 1) return 7;
        if (matched == 2) return 8;
        return 9;
    }
}
