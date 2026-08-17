# app/services/interview_blueprint.py
"""Rule-based Interview Blueprint Generator.
Creates competency-weighted interview structure from role + JD.
No LLM calls - deterministic and instant."""

from dataclasses import dataclass, field
from typing import List, Dict
import re

@dataclass
class CompetencyWeight:
    name: str
    weight: float  # 0.0-1.0, all weights sum to 1.0
    question_count: int
    difficulty_mix: Dict[str, float]  # {"JUNIOR": 0.2, "MID": 0.5, "SENIOR": 0.3}

@dataclass
class InterviewBlueprint:
    role_type: str  # "BACKEND", "FRONTEND", "FULLSTACK", "ML", "DEVOPS", "DATA", "HR", "GENERIC"
    competencies: List[CompetencyWeight]
    total_questions: int  # 15 (target)
    min_questions: int    # 10
    max_questions: int    # 18
    difficulty: str       # "JUNIOR", "MID", "SENIOR"
    interview_type: str   # "TECHNICAL", "HR"

class BlueprintEngine:
    def detect_role_type(self, job_title: str, jd_text: str) -> str:
        text = f"{job_title} {jd_text}".lower()
        
        roles = {
            "BACKEND": ["java", "spring", "node", "python", "api", "microservice", "backend", "server", "rest", "graphql", "django", "fastapi"],
            "FRONTEND": ["react", "vue", "angular", "next.js", "typescript", "css", "html", "frontend", "ui", "ux"],
            "FULLSTACK": ["fullstack", "full-stack", "full stack"],
            "ML": ["machine learning", "ml", "deep learning", "pytorch", "tensorflow", "nlp", "computer vision", "data science"],
            "DEVOPS": ["devops", "kubernetes", "docker", "ci/cd", "aws", "gcp", "azure", "cloud", "sre", "infrastructure"],
            "DATA": ["data engineer", "spark", "hadoop", "pipeline", "etl", "databricks", "dbt", "analytics"],
            "HR": ["hr", "human resources", "behavioral", "culture"]
        }
        
        scores = {role: 0 for role in roles}
        for role, keywords in roles.items():
            for kw in keywords:
                if kw in text:
                    scores[role] += 1
                    
        best_match = max(scores.items(), key=lambda x: x[1])
        if best_match[1] > 0:
            return best_match[0]
        return "GENERIC"

    def create_blueprint(self, job_title: str, jd_text: str, difficulty: str, interview_type: str) -> InterviewBlueprint:
        role_type = self.detect_role_type(job_title, jd_text)
        
        if interview_type.upper() == "HR":
            competencies = [
                CompetencyWeight("Behavioral & Situational", 0.30, 3, {"MID": 1.0}),
                CompetencyWeight("Culture Fit & Motivation", 0.30, 3, {"MID": 1.0}),
                CompetencyWeight("Leadership & Teamwork", 0.20, 2, {"MID": 1.0}),
                CompetencyWeight("Career Goals", 0.20, 2, {"MID": 1.0}),
            ]
            role_type = "HR"
        else:
            if role_type == "BACKEND":
                competencies = [
                    CompetencyWeight("Core Language & OOP", 0.20, 2, {"MID": 0.7, "SENIOR": 0.3}),
                    CompetencyWeight("APIs & Framework", 0.20, 2, {"MID": 0.6, "SENIOR": 0.4}),
                    CompetencyWeight("Database & ORM", 0.20, 2, {"MID": 0.6, "SENIOR": 0.4}),
                    CompetencyWeight("Resume Projects", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("DSA & Problem Solving", 0.20, 2, {"JUNIOR": 0.2, "MID": 0.5, "SENIOR": 0.3}),
                ]
            elif role_type == "FRONTEND":
                competencies = [
                    CompetencyWeight("Core JS/TS & Browser APIs", 0.20, 2, {"MID": 0.6, "SENIOR": 0.4}),
                    CompetencyWeight("Frontend Frameworks", 0.20, 2, {"MID": 0.6, "SENIOR": 0.4}),
                    CompetencyWeight("State Management & Performance", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Resume Projects", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("DSA & Problem Solving", 0.20, 2, {"MID": 0.6, "SENIOR": 0.4}),
                ]
            elif role_type == "FULLSTACK":
                competencies = [
                    CompetencyWeight("Backend APIs & DBs", 0.20, 2, {"MID": 0.6, "SENIOR": 0.4}),
                    CompetencyWeight("Frontend Frameworks", 0.20, 2, {"MID": 0.6, "SENIOR": 0.4}),
                    CompetencyWeight("System Design & Architecture", 0.20, 2, {"MID": 0.4, "SENIOR": 0.6}),
                    CompetencyWeight("Resume Projects", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("DSA & Problem Solving", 0.20, 2, {"JUNIOR": 0.2, "MID": 0.5, "SENIOR": 0.3}),
                ]
            elif role_type == "ML":
                competencies = [
                    CompetencyWeight("ML Fundamentals & Math", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Deep Learning & Frameworks", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Data Engineering & Pipelines", 0.20, 2, {"MID": 0.6, "SENIOR": 0.4}),
                    CompetencyWeight("Resume Projects", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("DSA & Python", 0.20, 2, {"JUNIOR": 0.2, "MID": 0.5, "SENIOR": 0.3}),
                ]
            elif role_type == "DEVOPS":
                competencies = [
                    CompetencyWeight("Containers & Kubernetes", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("CI/CD & Automation", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Cloud Infrastructure", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Resume Projects", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Scripting & Problem Solving", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                ]
            elif role_type == "DATA":
                competencies = [
                    CompetencyWeight("SQL & Data Modeling", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Big Data & Pipelines", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("ETL & Pipeline Design", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Resume Projects", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Python & Problem Solving", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                ]
            else:
                competencies = [
                    CompetencyWeight("Technical Knowledge", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("System Architecture", 0.20, 2, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("Resume Projects", 0.30, 3, {"MID": 0.5, "SENIOR": 0.5}),
                    CompetencyWeight("DSA & Problem Solving", 0.30, 3, {"MID": 0.5, "SENIOR": 0.5}),
                ]

        total_questions = sum([c.question_count for c in competencies])

        return InterviewBlueprint(
            role_type=role_type,
            competencies=competencies,
            total_questions=total_questions,
            min_questions=10,
            max_questions=10,
            difficulty=difficulty.upper() if difficulty else "MID",
            interview_type=interview_type.upper() if interview_type else "TECHNICAL"
        )

blueprint_service = BlueprintEngine()
