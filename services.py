import json
import os

from google import genai


def fallback_analysis(lead):

    industry = lead.get("industry", "Unknown")

    return {

        "company_overview":
            f"{lead['company_name']} operates in {industry}. "
            "This overview uses the information provided.",

        "business_needs": [
            f"Review operational requirements in the {industry} sector",
            "Identify technology and business improvement opportunities"
        ],

        "opportunities": [
            "Explore business process automation",
            "Evaluate software and cloud optimization opportunities"
        ],

        "industry_analysis":
            f"The company belongs to the {industry} industry. "
            "Further market research is recommended.",

        "qualification_score": 50,

        "recommended_action":
            "Verify business requirements and contact the decision-maker."
    }


def analyze_company(lead):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return fallback_analysis(lead)

    client = genai.Client(api_key=api_key)

    model = os.getenv(
        "GEMINI_MODEL",
        "gemini-2.5-flash"
    )

    prompt = f"""
    You are an expert B2B sales intelligence assistant.

    Analyse the following company information.

    Company Information:

    {json.dumps(lead)}

    Generate:

    1. Company Overview
    2. Business Needs
    3. Potential Business Opportunities
    4. Industry Analysis
    5. Qualification Score from 0 to 100
    6. Recommended Action

    Do not invent company facts.

    Return ONLY valid JSON in this format:

    {{
        "company_overview": "Description",

        "business_needs": [
            "Need 1",
            "Need 2"
        ],

        "opportunities": [
            "Opportunity 1",
            "Opportunity 2"
        ],

        "industry_analysis": "Industry details",

        "qualification_score": 85,

        "recommended_action": "Recommended action"
    }}
    """

    response = client.models.generate_content(
        model=model,
        contents=prompt
    )

    raw = response.text.strip()

    raw = raw.removeprefix("```json")
    raw = raw.removesuffix("```").strip()

    data = json.loads(raw)

    data["qualification_score"] = max(
        0,
        min(100, int(data["qualification_score"]))
    )

    return data