import re
from io import BytesIO
import logging
import pypdf
from app.llm.langchain_client import langchain_client
from app.schemas.parser import ResumeParsingResponse

logger = logging.getLogger("app")

COMMON_TECH_SKILLS = [
    "Java", "Spring Boot", "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express",
    "C++", "C#", ".NET", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS",
    "GCP", "Azure", "Git", "Kafka", "GraphQL", "REST API", "Microservices", "HTML", "CSS", "Tailwind",
    "DSA", "Algorithms", "System Design", "Linux", "CI/CD", "Machine Learning", "PyTorch", "TensorFlow",
    "Pandas", "NumPy", "Flutter", "Android", "Swift", "Spring Data", "Spring Security", "Hibernate"
]

def extract_heuristic_skills(text: str) -> list:
    if not text:
        return []
    text_upper = text.upper()
    found = []
    for skill in COMMON_TECH_SKILLS:
        pattern = r'\b' + re.escape(skill.upper()) + r'\b'
        if re.search(pattern, text_upper):
            found.append(skill)
    return found

class ParserService:
    def parse_resume_pdf(self, file_content: bytes) -> ResumeParsingResponse:
        """Extracts plain text from raw PDF bytes and dispatches it to the Gemini client for parsing."""
        extracted_text = ""
        try:
            # Read binary file from memory buffer
            pdf_file = BytesIO(file_content)
            reader = pypdf.PdfReader(pdf_file)
            
            text_parts = []
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
                else:
                    logger.warning("No text extracted from resume page %d. Might be scanned/empty.", page_num + 1)
            
            extracted_text = "\n".join(text_parts).strip()
            
        except Exception as e:
            logger.error("Failed to read PDF document structure: %s. Continuing with empty text.", str(e))
        
        if not extracted_text:
            logger.warning("Resume PDF extraction resulted in empty text. Proceeding to fallback parsing.")
            
        structured_data = langchain_client.parse_resume(extracted_text)
        heuristic_skills = extract_heuristic_skills(extracted_text)
        
        all_skills = list(dict.fromkeys((structured_data.skills or []) + heuristic_skills))
        if not all_skills:
            all_skills = ["Software Engineering", "Problem Solving", "System Architecture"]

        return ResumeParsingResponse(
            skills=all_skills,
            projects=structured_data.projects,
            education=structured_data.education,
            experience=structured_data.experience,
            raw_text=extracted_text
        )

parser_service = ParserService()
