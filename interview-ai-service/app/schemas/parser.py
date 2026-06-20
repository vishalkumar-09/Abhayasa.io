from pydantic import BaseModel, Field
from typing import List, Optional

class ExperienceItem(BaseModel):
    role: str = Field(description="The job title or role held by the candidate")
    company: str = Field(description="The name of the company or organization")
    duration: Optional[str] = Field(description="The period of employment, e.g. 'Jan 2021 - Present'")
    description: Optional[str] = Field(description="Summary describing the work performed or key accomplishments")

class EducationItem(BaseModel):
    degree: str = Field(description="The degree earned, e.g. 'Bachelor of Science in Computer Science'")
    school: str = Field(description="The name of the school, university, or institution")
    graduation_year: Optional[str] = Field(description="The year of graduation, e.g. '2023'")

class ProjectItem(BaseModel):
    title: str = Field(description="The name of the project")
    description: Optional[str] = Field(description="A description of the project and what it accomplished")
    technologies: List[str] = Field(description="List of programming languages, tools, or frameworks used in the project")

class StructuredResumeData(BaseModel):
    skills: List[str] = Field(description="List of technical skills, programming languages, libraries, and tools")
    projects: List[ProjectItem] = Field(description="List of key projects worked on by the candidate")
    education: List[EducationItem] = Field(description="Academic qualifications and history")
    experience: List[ExperienceItem] = Field(description="Professional work and employment history")

class ResumeParsingResponse(StructuredResumeData):
    raw_text: Optional[str] = Field(default=None, alias="raw_text", description="The raw extracted text of the PDF resume")
