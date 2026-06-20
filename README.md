# InterviewForge AI 🚀

An AI-powered mock interview platform that conducts personalized technical interviews by analyzing a candidate's resume and target job description. The system generates context-aware interview questions, evaluates responses using LLMs, and provides detailed feedback and improvement roadmaps.

---

## 📌 Problem Statement

Most interview preparation platforms provide generic questions and limited feedback. Candidates often struggle to prepare for interviews tailored to their resume, projects, and target job roles.

**InterviewForge AI** solves this problem by creating personalized interview experiences using Generative AI, Retrieval-Augmented Generation (RAG), and vector search.

---

## ✨ Features

### Authentication & User Management

* Secure JWT Authentication
* User Registration & Login
* Protected Routes
* Profile Management

### Resume Analysis

* PDF Resume Upload
* AI-Powered Resume Parsing
* Skill Extraction
* Project Extraction
* Experience Analysis

### Job Description Analysis

* Upload or Paste Job Descriptions
* Skill Gap Analysis
* Context-Aware Interview Generation

### AI Interview Generation

* Resume-Based Questions
* Project-Specific Questions
* Technical Questions
* DSA Questions
* HR Questions

### Interview Session

* Interactive Question Flow
* Answer Submission
* Progress Tracking
* Interview Completion Workflow

### AI Evaluation Engine

* Technical Accuracy Scoring
* Communication Assessment
* Depth of Knowledge Analysis
* Completeness Evaluation
* Personalized Feedback

### Report Generation

* Overall Performance Score
* Strengths & Weaknesses
* Missing Concepts
* Improvement Roadmap
* Interview History Tracking

---

## 🏗️ System Architecture

```text
                     Next.js Frontend
                             │
                             ▼
                   Spring Boot Backend
                             │
             ┌───────────────┴───────────────┐
             ▼                               ▼
      PostgreSQL                     FastAPI AI Service
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                         Gemini LLM                    Qdrant
                                             (Vector Database)
```

---

## 🛠️ Tech Stack

### Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI
* React Query
* Axios

### Backend

* Spring Boot 3
* Java 21
* Spring Security
* JWT Authentication
* Spring Data JPA

### AI Service

* FastAPI
* Python
* Gemini API
* RAG Pipeline

### Databases

* PostgreSQL
* Qdrant Vector Database

---

## 📂 Project Structure

```text
InterviewForge/

├── frontend/
│   ├── src/
│   ├── components/
│   ├── services/
│   └── app/
│
├── backend-spring/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   ├── dto/
│   └── security/
│
├── ai-service/
│   ├── routers/
│   ├── services/
│   ├── schemas/
│   ├── rag/
│   ├── llm/
│   └── vector_db/
│

```

---

## 🗄️ Core Modules

### Spring Boot Service

* Authentication
* User Management
* Resume Management
* Interview Sessions
* Report Management

### FastAPI Service

* Resume Parsing
* Question Generation
* Answer Evaluation
* Report Generation
* Vector Search

---

## 🔄 Interview Workflow

```text
Resume Upload
      │
      ▼
Resume Parsing
      │
      ▼
Job Description Analysis
      │
      ▼
Question Generation
      │
      ▼
Mock Interview Session
      │
      ▼
Answer Evaluation
      │
      ▼
Performance Report
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/your-username/interviewforge.git
cd interviewforge
```

### Start PostgreSQL

```bash
docker run \
--name postgres \
-e POSTGRES_PASSWORD=postgres \
-e POSTGRES_DB=interviewforge \
-p 5432:5432 \
-d postgres
```

### Start Qdrant

```bash
docker run \
-p 6333:6333 \
-p 6334:6334 \
qdrant/qdrant
```

### Run Spring Boot

```bash
cd backend-spring
mvn spring-boot:run
```

### Run FastAPI

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Future Enhancements

* Voice-Based Interviews
* Real-Time Speech Analysis
* AI Interviewer Avatar
* Adaptive Difficulty System
* Company-Specific Interview Modes
* Multi-Language Support
* Advanced Analytics Dashboard
* Interview Replay System

---

## 📈 Learning Outcomes

This project demonstrates:

* Full-Stack Development
* Microservices Architecture
* Spring Boot Development
* FastAPI Development
* JWT Authentication
* PostgreSQL Database Design
* Vector Databases
* Retrieval-Augmented Generation (RAG)
* LLM Integration
* System Design Principles


---

## 👨‍💻 Author

**Vishal Kumar Gaud**

Built as a production-grade AI-powered interview preparation platform showcasing modern software engineering, microservices, and Generative AI concepts.
