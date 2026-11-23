from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..services.ai_service import (
    generate_email,
    generate_recommendation,
    generate_personalized_email,
    recommend_outreach,
    score_lead
)

router = APIRouter(
    prefix="/api/outreach",
    tags=['Outreach Generation']
)

def get_lead_data(lead):

    return {
        "company_name": lead.company_name,
        "industry": lead.industry,
        "contact_person": lead.contact_person,
        "email": lead.email,
        "website": lead.website,
        "employee_count": lead.employee_count,
        "location": lead.location,
        "description": lead.description,
        "technology_stack": lead.technology_stack
    }


# Generate personalized email

@router.post(
    "/generate/{lead_id}",
    response_model=schemas.EmailOut   
)
@router.post(
    "/generate({lead_id})",
    response_model=schemas.EmailOut,
    include_in_schema=False
)
def create_email(
    lead_id: int,
    payload: schemas.EmailGenerationRequest,
    db: Session = Depends(get_db)
):
    lead = db.get(models.Lead, lead_id)

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    try:

        result =  generate_email(
            get_lead_data(lead),
            payload.service_offered,
            payload.tone,
            payload.additional_context
        )

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=f"Email generation failed: {str(exc)}"
        )

    email = models.OutreachEmail(
        lead_id=lead_id,
        recipient=lead.email,
        subject=result["subject"],
        body=result['body'],
        tone=payload.tone
    )

    db.add(email)
    db.commit()
    db.refresh(email)

    return email


@router.get(
    "/{lead_id}",
    response_model=list[schemas.EmailOut]
)
def get_emails(
    lead_id: int,
    db: Session = Depends(get_db)
):
    if not db.get(models.Lead, lead_id):
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    return (
        db.query(models.OutreachEmail)
        .filter(models.OutreachEmail.lead_id == lead_id)
        .order_by(models.OutreachEmail.created_at.desc())
        .all()
    )



#Generate Outreach Recommendation
@router.post(
    '/recommend/{lead_id}',
    response_model=schemas.RecommendationOut
)
def create_recommendation(
    lead_id: int,
    db: Session = Depends(get_db)
):
    lead = db.get(models.Lead, lead_id)

    if not lead:

        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    score = (
        db.query(models.LeadScore)
        .filter(models.LeadScore.lead_id == lead_id)
        .order_by(models.LeadScore.created_at.desc())
        .first()
    )

    if not score:
        raise HTTPException(
            status_code=400,
            detail="Calculate lead score first"
        )

    try:
        result = generate_recommendation(
            get_lead_data(lead),
            score.total_score,
            score.priority
        )

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=f"Recommendation failed: {str(exc)}"
        )

    recommendation = models.OutreachRecommendation(

        lead_id=lead_id,

        channel=result["channel"],

        follow_up_timing=result["follow_up_timing"],

        strategy=result["strategy"],
        next_action=result["next_action"]

    )

    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    return recommendation


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
            get_lead_data(lead), _analysis_data(analysis)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Email draft generation failed: {exc}"
        ) from exc


@router.get("/{lead_id}/score", response_model=schemas.LeadScoreOut)
def get_lead_score(lead_id: int, db: Session = Depends(get_db)):
    lead = _require_lead(db, lead_id)
    analysis = _get_latest_analysis(db, lead_id)
    return score_lead(get_lead_data(lead), _analysis_data(analysis))


@router.get(
    "/{lead_id}/recommendations",
    response_model=schemas.OutreachRecommendationsOut,
)
def get_outreach_recommendations(lead_id: int, db: Session = Depends(get_db)):
    lead = _require_lead(db, lead_id)
    analysis = _get_latest_analysis(db, lead_id)
    return recommend_outreach(get_lead_data(lead), _analysis_data(analysis))
