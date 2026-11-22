import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
import models
from main import app
from services import generate_personalized_email, recommend_outreach, score_lead


test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_test_data():
    with TestSession() as db:
        db.query(models.CompanyAnalysis).delete()
        db.query(models.Lead).delete()
        db.commit()
    yield


def create_lead(**values):
    with TestSession() as db:
        lead = models.Lead(
            company_name="Example Co",
            industry="Manufacturing",
            status="New",
            **values,
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead.id


def test_fallback_email_only_uses_saved_details(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    draft = generate_personalized_email(
        {
            "company_name": "Example Co",
            "industry": "Manufacturing",
            "contact_person": "Riley",
            "description": "Interested in inventory planning.",
        }
    )

    assert draft["subject"]
    assert "Hi Riley," in draft["body"]
    assert "Interested in inventory planning." in draft["body"]
    assert "research" not in draft["body"].lower()


@pytest.mark.parametrize(
    "response_text",
    [
        "not json",
        '{"subject": "Only a subject"}',
        '{"subject": "", "body": "Missing subject"}',
    ],
)
def test_invalid_or_incomplete_ai_email_response_fails(monkeypatch, response_text):
    class FakeModels:
        def generate_content(self, model, contents):
            return type(
                "Response",
                (),
                {"text": response_text, "model": model, "contents": contents},
            )()

    class FakeClient:
        def __init__(self, api_key):
            self.api_key = api_key

        models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr("services.genai.Client", FakeClient)

    with pytest.raises(ValueError, match="AI"):
        generate_personalized_email({"company_name": "Example Co"})


def test_score_and_recommendations_handle_missing_details():
    lead = {"company_name": "Example Co", "industry": "Manufacturing", "status": "New"}

    score = score_lead(lead)
    recommendations = recommend_outreach(lead)

    assert 0 <= score["score"] <= 100
    assert score["qualification_label"] == "Needs more information"
    assert any("No saved company analysis" in factor for factor in score["factors"])
    assert recommendations["information_sufficient"] is False
    assert "Email address or phone number" in recommendations["missing_information"]
    assert "verify contact details" in recommendations["suggested_channel"]


def test_outreach_endpoints_return_score_and_missing_information():
    lead_id = create_lead()

    score_response = client.get(f"/api/outreach/{lead_id}/score")
    recommendations_response = client.get(
        f"/api/outreach/{lead_id}/recommendations"
    )

    assert score_response.status_code == 200
    assert 0 <= score_response.json()["score"] <= 100
    assert recommendations_response.status_code == 200
    assert recommendations_response.json()["information_sufficient"] is False


def test_outreach_endpoint_reports_missing_lead():
    response = client.get("/api/outreach/99999/score")

    assert response.status_code == 404
    assert response.json()["detail"] == "Lead not found"


def test_email_endpoint_includes_saved_company_analysis(monkeypatch):
    lead_id = create_lead(email="riley@example.com", description="Inventory planning")
    with TestSession() as db:
        db.add(
            models.CompanyAnalysis(
                lead_id=lead_id,
                company_overview="Example Co manufactures components.",
                business_needs="Inventory planning",
                opportunities="Review forecasting workflows",
                industry_analysis="Manufacturing",
                qualification_score=72,
                recommended_action="Contact the lead",
            )
        )
        db.commit()

    received = {}

    def fake_generator(lead, analysis):
        received["lead"] = lead
        received["analysis"] = analysis
        return {"subject": "A note for Example Co", "body": "Draft body"}

    monkeypatch.setattr("router.outreach.generate_personalized_email", fake_generator)
    response = client.post(f"/api/outreach/{lead_id}/email")

    assert response.status_code == 200
    assert response.json()["subject"] == "A note for Example Co"
    assert received["lead"]["email"] == "riley@example.com"
    assert received["analysis"]["business_needs"] == "Inventory planning"


def test_email_endpoint_returns_gateway_error_for_invalid_ai_response(
    monkeypatch,
):
    lead_id = create_lead()

    def fail_generation(lead, analysis):
        raise ValueError(
            f"invalid AI response for {lead.get('company_name')}: {analysis}"
        )

    monkeypatch.setattr("router.outreach.generate_personalized_email", fail_generation)

    response = client.post(f"/api/outreach/{lead_id}/email")

    assert response.status_code == 502
    assert "invalid AI response" in response.json()["detail"]
