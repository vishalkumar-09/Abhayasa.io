from io import BytesIO
import logging
import pypdf
from app.llm.langchain_client import langchain_client
from app.schemas.parser import ResumeParsingResponse

logger = logging.getLogger("app")

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
        return ResumeParsingResponse(
            skills=structured_data.skills,
            projects=structured_data.projects,
            education=structured_data.education,
            experience=structured_data.experience,
            raw_text=extracted_text
        )

parser_service = ParserService()
