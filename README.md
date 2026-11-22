# Al-Powered-Intelligent-Sales-Forecasting-Platform
## AI-Powered Intelligent Sales Forecasting Platform using Predictive Analytics 

## 🚀 Project Milestones

### Milestone 1 (Weeks 1–2) – Lead Management & Intelligence Engine

- Develop a prospect database and lead management system.
- Implement company profile analysis functionality.
- Generate AI-powered lead insights.
- Manage prospect and customer records efficiently.
- Identify potential business opportunities through company analysis.

### Milestone 2 (Weeks 3–4) – Outreach Generation & Lead Scoring

- Implement personalized email generation.
- Develop a lead scoring and qualification engine.
- Predict lead conversion probability.
- Generate AI-powered outreach recommendations.
- Suggest effective follow-up strategies and customer engagement approaches.

## Run the web app

Configure `DATABASE_URL` in the environment or a `.env` file, install the packages in
`requirements.txt`, and start the FastAPI server:

```bash
uvicorn main:app --reload
```

Open `http://127.0.0.1:8000/` for the dashboard. FastAPI serves the frontend from
`static/`, keeps the API available under `/api/`, and exposes its interactive API
documentation at `/docs`. The API supports lead management, company intelligence,
and outreach workflows:

- `POST /api/outreach/{lead_id}/email` returns an editable draft and never sends it.
- `GET /api/outreach/{lead_id}/score` returns a heuristic score and its factors. It
  is not a conversion probability.
- `GET /api/outreach/{lead_id}/recommendations` returns a suggested action, channel,
  timing, and engagement sequence. Recommendations note when saved details are
  insufficient; interaction history is not currently tracked.

Set `GEMINI_API_KEY` in the environment or `.env` file to enable AI-generated email
drafts; without it, the app creates a basic draft from saved lead details. No email
is sent by the application.

The sales forecasting screen remains informational until forecast and sales-history
endpoints are implemented.