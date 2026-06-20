import json
import logging
import google.generativeai as genai
from app.core.settings import settings
from app.schemas.parser import ResumeParsingResponse, StructuredResumeData

logger = logging.getLogger("app")

# Configure Google Generative AI
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY":
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        logger.info("Gemini API configured successfully.")
    except Exception as e:
        logger.error("Failed to configure Gemini API: %s", str(e))
else:
    logger.warning("GEMINI_API_KEY is not set. The parser will run in mock fallback mode.")

class GeminiClient:
    def __init__(self):
        try:
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            self.is_ready = True
        except Exception as e:
            logger.error("Failed to initialize GenerativeModel: %s", str(e))
            self.is_ready = False

    def parse_resume(self, resume_text: str) -> StructuredResumeData:
        """Parses raw resume text into structured JSON matching the Pydantic response schema."""
        # Fallback check if API key is not configured or setup failed
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY" or not self.is_ready:
            logger.info("Gemini client running in mock mode. Returning mock resume parse payload.")
            mock_data = self.get_mock_parse_response()
            return StructuredResumeData(**mock_data)

        prompt = f"""
        Analyze the following candidate resume text and extract all relevant information.
        Categorize the data precisely into skills, projects, education, and professional experience.

        Resume Text:
        ---
        {resume_text}
        ---
        """

        try:
            # Configure Gemini API to enforce structured JSON output matching Pydantic response schema
            generation_config = {
                "response_mime_type": "application/json",
                "response_schema": StructuredResumeData
            }

            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            # Parse the JSON response directly
            parsed_json = json.loads(response.text)
            return StructuredResumeData(**parsed_json)

        except Exception as e:
            logger.error("Error during Gemini API resume parsing: %s. Falling back to mock details.", str(e))
            return StructuredResumeData(**self.get_mock_parse_response())

    def get_mock_parse_response(self) -> dict:
        """Helper to return realistic parsed mock resume details for developer evaluation."""
        return {
            "skills": [
                "Java", "Python", "JavaScript", "TypeScript", 
                "Spring Boot", "FastAPI", "Next.js", "PostgreSQL", 
                "Docker", "Git", "REST APIs"
            ],
            "projects": [
                {
                    "title": "InterviewForge - AI Simulator",
                    "description": "Designed and built an AI-powered mock interview simulator with Spring Boot and FastAPI.",
                    "technologies": ["Spring Boot", "FastAPI", "Next.js", "PostgreSQL", "Docker"]
                },
                {
                    "title": "TaskMaster Tool",
                    "description": "Developed a collaborative project manager with real-time updates.",
                    "technologies": ["Node.js", "React", "MongoDB", "WebSockets"]
                }
            ],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "school": "Metropolis University of Technology",
                    "graduation_year": "2024"
                }
            ],
            "experience": [
                {
                    "role": "Software Developer Intern",
                    "company": "TechInnovate Solutions",
                    "duration": "Jun 2023 - Present",
                    "description": "Contributed to backend REST endpoints implementation and automated unit testing script suites using Pytest."
                }
            ]
        }

# Singleton instance
gemini_client = GeminiClient()
