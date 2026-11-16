from typing import Optional
from pydantic import(
    BaseModel,
    ConfigDict
)
from datetime import datetime


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