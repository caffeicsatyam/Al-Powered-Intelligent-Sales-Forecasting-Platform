from pathlib import Path
import joblib

MODEL_PATH = (
    Path(__file__).resolve().parents[1] / "ml" / "conversion_model.joblib"
)

def calculate_score(data):

    total_score = (
        data["company_growth"]
        + data["industry_match"]
        + data["technology_alignment"]
        + data["business_need"]
        + data["engagement_level"]
    )

    if total_score >= 80:
        priority = "High"

    elif total_score >= 50:
        priority = "Medium"

    else:
        priority = "Low"

    return  total_score, priority


def predict_conversion_probability(data):

    if not MODEL_PATH.exists():
        return None, "model_not_trained"

    model = joblib.load(MODEL_PATH)
    features = [[
        data["company_growth"],
        data['industry_match'],
        data["business_need"],
        data["engagement_level"]
    ]]

    probability = model.predict_proba(features)[0][1]

    return round(float(probability) * 100, 2), (
        "trained_scikit_learn_model"
    )