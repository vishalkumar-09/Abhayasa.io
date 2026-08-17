# app/llm/prompts.py
"""Centralized, structured LLM prompt templates for InterviewForge AI Service."""

BLUEPRINT_QUESTION_PROMPT = """You are an expert technical interviewer.
Generate exactly {question_count} interview questions strictly based on the candidate's verified skills and resume projects.
Job Title: {job_title}
Company: {company_name}
Interview Type: {interview_type}
Difficulty: {difficulty}

Candidate Skills: {resume_skills}
Candidate Resume Projects & Highlights:
{resume_projects}

Candidate Experience:
{resume_experience}

Job Description Context:
{jd_requirements}

Previous Questions (DO NOT REPEAT):
{previous_questions}

Target Competencies:
{competency_blueprint}

STRICT GENERATION RULES:
1. Every technical, architecture, and project question MUST directly reference and test the candidate's actual skills ({resume_skills}) and projects ({resume_projects}).
2. Do NOT ask questions about unrelated tools or languages that are absent from both the candidate's resume and the job description.
3. Generate exactly {question_count} distinct questions (no generic or duplicate questions).

Return ONLY a valid JSON object in this exact schema:
{{
  "questions": [
    {{
      "question_text": "...",
      "category": "RESUME|TECHNICAL|DSA|SYSTEM_DESIGN|HR",
      "difficulty": "JUNIOR|MID|SENIOR",
      "expected_keywords": ["...", "..."],
      "competency": "...",
      "is_primary": true
    }}
  ]
}}
"""

ADAPTIVE_FOLLOWUP_PROMPT = """You are an expert technical interviewer asking a follow-up question based on the candidate's previous answer.

Topic / Question: {question_text}
Candidate's Answer: {answer_text}
Target Depth: {target_depth}
Previous Follow-ups (DO NOT REPEAT): {history}

Return ONLY a valid JSON object in this exact format:
{{
  "followup_question": "..."
}}

STRICT JSON RULES:
1. "followup_question" must contain a single, concise technical question under 25 words ending with a question mark (?).
2. Do NOT include any thoughts, reasoning, markdown text, bullet points, or meta-commentary outside or inside the JSON.
"""

EVIDENCE_EVALUATOR_PROMPT = """You are an expert technical interview evaluator.
Question: {question_text}
Expected Keywords: {expected_keywords}
Difficulty: {difficulty}

Candidate Answer: {answer_text}

Evaluate the candidate's answer.
Return ONLY valid JSON in this exact schema:
{{
  "score": 8,
  "technicalScore": 80,
  "communicationScore": 75,
  "depthScore": 70,
  "completenessScore": 85,
  "feedback": "...",
  "evidenceQuote": "literal phrase quoted from candidate answer",
  "missedConcepts": ["concept1", "concept2"],
  "answerStrength": "STRONG|PARTIAL|WEAK|BLANK"
}}

Rules:
- evidenceQuote must be a verbatim literal quote from the candidate answer. If blank, set to null.
- missedConcepts are expected keywords NOT mentioned.
- answerStrength: BLANK if empty, WEAK if score<4, PARTIAL if 4-7, STRONG if >7.
"""

STRUCTURED_REPORT_PROMPT = """You are an expert technical interviewer writing a final report.
Job Title: {job_title}
Company: {company_name}
Interview Type: {interview_type}
Difficulty: {difficulty}
Resume Skills: {resume_skills}
Overall Score: {overall_score}

Competency Summary:
{competency_summary}

Q&A Transcript:
{qa_transcript}

Return ONLY valid JSON in this exact schema:
{{
  "overallScore": 7.5,
  "summary": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "missingConcepts": ["...", "..."],
  "improvementRoadmap": ["...", "..."],
  "recommendations": "...",
  "readiness": "INTERVIEW_READY|NEEDS_IMPROVEMENT|NOT_READY",
  "readinessScore": 72,
  "competencyBreakdown": [
    {{
      "name": "System Design",
      "score": 75,
      "evidence": "..."
    }}
  ],
  "roleAlignment": {{
    "matchedSkills": ["Java", "Spring"],
    "gapSkills": ["Kafka"],
    "roleMatchPercent": 80
  }},
  "nextInterviewPlan": ["...", "..."]
}}

Rules:
- readiness: INTERVIEW_READY >= 75, NEEDS_IMPROVEMENT 50-74, NOT_READY < 50.
- nextInterviewPlan must be SPECIFIC to the gaps found, not generic advice.
"""
