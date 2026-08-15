package com.interviewforge.repository;

import com.interviewforge.entity.Interview;
import com.interviewforge.entity.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByUserIdOrderByIdDesc(Long userId);
    List<Interview> findByUserIdAndStatus(Long userId, InterviewStatus status);

    @Modifying
    @Query("UPDATE Interview i SET i.resume = null WHERE i.resume.id = :resumeId")
    void setResumeToNull(@Param("resumeId") Long resumeId);

    @Modifying
    @Query("UPDATE Interview i SET i.jobDescription = null WHERE i.jobDescription.id = :jobId")
    void setJobDescriptionToNull(@Param("jobId") Long jobId);
}
