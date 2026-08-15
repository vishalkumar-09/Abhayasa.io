from pydantic import BaseModel, Field, AliasChoices, field_validator
from typing import List, Optional, Union

class ExperienceItem(BaseModel):
    role: Optional[str] = Field(default="Software Engineer", validation_alias=AliasChoices('role', 'title', 'position'))
    company: Optional[str] = Field(default="Company", validation_alias=AliasChoices('company', 'organization', 'employer'))
    duration: Optional[str] = Field(default=None, validation_alias=AliasChoices('duration', 'period', 'dates'))
    description: Optional[Union[str, List[str]]] = Field(default=None, validation_alias=AliasChoices('description', 'summary', 'highlights'))

    @field_validator('description', mode='before')
    @classmethod
    def join_description_list(cls, v):
        if isinstance(v, list):
            return " ".join([str(item) for item in v if item])
        return v

class EducationItem(BaseModel):
    degree: Optional[str] = Field(default="Degree", validation_alias=AliasChoices('degree', 'qualification', 'major'))
    school: Optional[str] = Field(default="Institution", validation_alias=AliasChoices('school', 'institution', 'university', 'college'))
    graduation_year: Optional[str] = Field(default=None, validation_alias=AliasChoices('graduation_year', 'gradYear', 'year'))

class ProjectItem(BaseModel):
    title: Optional[str] = Field(default="Project", validation_alias=AliasChoices('title', 'name', 'project_name'))
    description: Optional[Union[str, List[str]]] = Field(default=None, validation_alias=AliasChoices('description', 'summary', 'details'))
    technologies: List[str] = Field(default_factory=list, validation_alias=AliasChoices('technologies', 'techStack', 'tech_stack', 'tools', 'skills'))

    @field_validator('description', mode='before')
    @classmethod
    def join_project_description_list(cls, v):
        if isinstance(v, list):
            return " ".join([str(item) for item in v if item])
        return v

    @field_validator('technologies', mode='before')
    @classmethod
    def ensure_tech_list(cls, v):
        if isinstance(v, str):
            return [t.strip() for t in v.split(',') if t.strip()]
        return v

class StructuredResumeData(BaseModel):
    skills: List[str] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)

class ResumeParsingResponse(StructuredResumeData):
    raw_text: Optional[str] = Field(default=None, alias="raw_text", description="The raw extracted text of the PDF resume")
