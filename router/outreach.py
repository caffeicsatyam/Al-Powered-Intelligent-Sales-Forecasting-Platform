from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from services import generate_personalized_email, recommend_outreach, score_lead


router = APIRouter(prefix="/api/outreach", tags=["Sales Outreach"])


def _get_lead_data(lead: models.Lead) -> dict:
    return {
        "company_name": lead.company_name,
        "industry": lead.industry,
        "contact_person": lead.contact_person,
        "email": lead.email,
        "phone": lead.phone,
        "website": lead.website,
        "employee_count": lead.employee_count,
        "location": lead.location,
        "description": lead.description,
        "technology_stack": lead.technology_stack,
        "status": lead.status,
    }


def _get_latest_analysis(db: Session, lead_id: int) -> models.CompanyAnalysis | None:
    return (
        db.query(models.CompanyAnalysis)
        .filter(models.CompanyAnalysis.lead_id == lead_id)
        .order_by(
            models.CompanyAnalysis.generated_at.desc(),
            models.CompanyAnalysis.id.desc(),
        )
        .first()
    )


def _analysis_data(
    analysis: models.CompanyAnalysis | None,
) -> dict | None:
    if analysis is None:
        return None
    return {
        "company_overview": analysis.company_overview,
        "business_needs": analysis.business_needs,
        "opportunities": analysis.opportunities,
        "industry_analysis": analysis.industry_analysis,
        "qualification_score": analysis.qualification_score,
        "recommended_action": analysis.recommended_action,
    }


def _require_lead(db: Session, lead_id: int) -> models.Lead:
    lead = db.get(models.Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/{lead_id}/email", response_model=schemas.EmailDraftOut)
def create_email_draft(lead_id: int, db: Session = Depends(get_db)):
    lead = _require_lead(db, lead_id)
    analysis = _get_latest_analysis(db, lead_id)
    try:
        return generate_personalized_email(
            _get_lead_data(lead), _analysis_data(analysis)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Email draft generation failed: {exc}"
        ) from exc


@router.get("/{lead_id}/score", response_model=schemas.LeadScoreOut)
def get_lead_score(lead_id: int, db: Session = Depends(get_db)):
    lead = _require_lead(db, lead_id)
    analysis = _get_latest_analysis(db, lead_id)
    return score_lead(_get_lead_data(lead), _analysis_data(analysis))


@router.get(
    "/{lead_id}/recommendations",
    response_model=schemas.OutreachRecommendationsOut,
)
def get_outreach_recommendations(lead_id: int, db: Session = Depends(get_db)):
    lead = _require_lead(db, lead_id)
    analysis = _get_latest_analysis(db, lead_id)
    return recommend_outreach(_get_lead_data(lead), _analysis_data(analysis))
