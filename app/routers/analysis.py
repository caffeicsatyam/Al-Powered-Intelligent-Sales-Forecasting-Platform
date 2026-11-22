# Hadles Analysis Requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..services.ai_service import analyze_company

router = APIRouter(
    prefix='/api/analysis',
    tags=['Company Intelligence']
)

@router.post(
    "/{lead_id}",
    response_model=schemas.AnalysisOut
)

def create_analysis(
    lead_id: int,
    db: Session = Depends(get_db)
):

    lead = db.get(models.Lead, lead_id)

    if not lead:

        raise HTTPException(
            status_code=404,
            detail="Lead Not Found"
        )

    lead_data = {
        "company_name": lead.company_name,
        "industry": lead.industry,
        "contact_person": lead.contact_person,
        "website": lead.website,
        "employee_count": lead.employee_count,
        "location": lead.location,
        "description": lead.description,
        "technology_stack": lead.technology_stack


    }

    try:
        result = analyze_company(lead_data)

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=f"AI analysis failed: {str(exc)}"
        )

    analysis = models.CompanyAnalysis(

        lead_id=lead.id,

        company_overview=result["company_overview"],

        business_needs="\n".join(
            result["business_needs"]
        ),

        opportunities="\n".join(
            result["opportunities"]
        ),

        industry_analysis=result["industry_analysis"],
        qualification_score=result["qualification_score"],
        recommended_action=result["recommended_action"]

    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis