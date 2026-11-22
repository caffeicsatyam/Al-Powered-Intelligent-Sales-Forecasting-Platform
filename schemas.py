# Defines how data is validated and returned through APIs and reqests schemas
from typing import Optional
from pydantic import (
    Field,
    EmailStr,
    BaseModel,
    ConfigDict,
)
from datetime import datetime
class LeadCreate(BaseModel):
    company_name: str = Field(min_length=1, max_length=200)
    industry: str = Field(min_length=1, max_length=120)
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    employee_count: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    technology_stack: Optional[str] = None
    status: str = "New"


class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    employee_count: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    technology_stack: Optional[str] = None
    status: Optional[str] = None


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_name: str
    industry: str
    contact_person: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    employee_count: Optional[str]
    location: Optional[str]
    description: Optional[str]
    technology_stack: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
class AnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lead_id: int
    company_overview: str
    business_needs: str
    opportunities: str
    industry_analysis: str
    qualification_score: int
    recommended_action: str
    generated_at: datetime


class EmailDraftOut(BaseModel):
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)


class LeadScoreOut(BaseModel):
    score: int = Field(ge=0, le=100)
    qualification_label: str
    factors: list[str]
    score_basis: str


class OutreachRecommendationsOut(BaseModel):
    recommended_next_action: str
    suggested_channel: str
    follow_up_timing: str
    engagement_sequence: list[str]
    information_sufficient: bool
    missing_information: list[str]