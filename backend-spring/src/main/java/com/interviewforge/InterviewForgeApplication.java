package com.interviewforge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class InterviewForgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(InterviewForgeApplication.class, args);
    }
}
