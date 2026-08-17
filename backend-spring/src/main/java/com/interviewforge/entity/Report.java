package com.interviewforge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false, unique = true)
    private Interview interview;

    @Column(name = "overall_score", precision = 4, scale = 2)
    private BigDecimal overallScore;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_strengths", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "strength")
    private List<String> strengths;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_weaknesses", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "weakness")
    private List<String> weaknesses;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "competency_breakdown", columnDefinition = "TEXT")
    private String competencyBreakdown;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_missing_concepts", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "concept")
    private List<String> missingConcepts;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_next_plan", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "plan_step")
    private List<String> nextInterviewPlan;

    @Column(name = "readiness", length = 50)
    private String readiness;

    @Column(name = "readiness_score")
    private Integer readinessScore;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
