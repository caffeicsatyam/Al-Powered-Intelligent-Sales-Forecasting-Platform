import { useState } from "react";
import { ConfusionMatrixSvg } from "./ConfusionMatrixSvg";

const DIAGRAMS = [
  {
    id: "workflow",
    label: "Workflow Pipeline",
    src: "/static/workflow-diagram.png",
    caption: "End-to-end lead ingestion, AI enrichment, ML scoring, and outreach loop",
  },
  {
    id: "architecture",
    label: "System Architecture",
    src: "/static/architecture-diagram.png",
    caption: "FastAPI routers, Gemini service layer, scikit-learn estimator, and PostgreSQL/SQLite persistence",
  },
  {
    id: "schema",
    label: "Database Schema",
    src: "/static/database-schema.png",
    caption: "Relational model across leads, company_analyses, lead_scores, outreach_emails, and recommendations",
  },
] as const;

const FEATURE_SPEC = [
  { name: "company_growth", scale: "0 – 10", desc: "Revenue/headcount expansion and funding velocity" },
  { name: "industry_match", scale: "0 – 10", desc: "Strategic fit against target vertical specialization" },
  { name: "technology_alignment", scale: "0 – 10", desc: "Cloud, modern data, and API compatibility" },
  { name: "business_need", scale: "0 – 10", desc: "Clarity and urgency of modernization bottlenecks" },
  { name: "engagement_level", scale: "0 – 10", desc: "Stakeholder responsiveness and buying sponsorship" },
];

export function ModelArchitectureView() {
  const [selectedDiagram, setSelectedDiagram] = useState<string>("workflow");
  const [diagramLoadError, setDiagramLoadError] = useState<Record<string, boolean>>({});

  const activeDiagram =
    DIAGRAMS.find((d) => d.id === selectedDiagram) ?? DIAGRAMS[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="two-col-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Scikit-Learn Conversion Classifier</h2>
              <p className="panel-subtitle">
                Trained RandomForestClassifier artifact (<code className="mono">conversion_model.joblib</code>)
              </p>
            </div>
            <span className="priority-badge priority-high">Active Estimator</span>
          </div>
          <div className="panel-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-hairline)" }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                  Test Split Accuracy / F1
                </div>
                <div className="tabular" style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--signal-positive)" }}>
                  100.0% · 1.00
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                  Evaluated on 4 held-out rows (12 training rows)
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-hairline)" }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                  Estimator Config
                </div>
                <div className="tabular" style={{ fontSize: "var(--text-md)", fontWeight: 700, marginTop: 2 }}>
                  200 Trees · Max Depth 5
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                  Balanced class weights · Stratified split
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 16 }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-secondary)", marginBottom: 10 }}>
                Held-Out Evaluation Confusion Matrix (dataset/historical_leads.csv)
              </div>
              <ConfusionMatrixSvg />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Scoring &amp; Prediction Feature Contract</h2>
              <p className="panel-subtitle">
                5 validated numeric dimensions ingested by <code className="mono">/api/scoring/predict/&#123;lead_id&#125;</code>
              </p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature Key</th>
                  <th>Range</th>
                  <th>Signal Meaning</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_SPEC.map((f) => (
                  <tr key={f.name}>
                    <td>
                      <code className="tech-tag">{f.name}</code>
                    </td>
                    <td className="tabular" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                      {f.scale}
                    </td>
                    <td style={{ color: "var(--ink-secondary)" }}>{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-body" style={{ borderTop: "1px solid var(--border-hairline)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-secondary)", lineHeight: 1.6 }}>
              <strong>Note on calibration:</strong> Weighted heuristic scores map
              the 50-point sum directly to 0–100 priority tiers (High ≥ 80, Medium
              ≥ 50, Low &lt; 50), while <code className="mono">conversation_probability</code>{" "}
              is computed independently via <code className="mono">predict_proba</code>{" "}
              on the persisted scikit-learn model. Because the bundled sample CSV has
              16 records (12 train / 4 test), re-training on larger historical CRM
              cohorts is recommended for production forecasting calibration.
            </div>
          </div>
        </section>
      </div>

      {/* Platform Architecture Diagrams */}
      <section className="panel">
        <div className="panel-header" style={{ flexWrap: "wrap" }}>
          <div>
            <h2 className="panel-title">Platform Architecture &amp; Data Model</h2>
            <p className="panel-subtitle">{activeDiagram.caption}</p>
          </div>
          <div className="filter-pills">
            {DIAGRAMS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`filter-pill ${selectedDiagram === d.id ? "is-active" : ""}`}
                onClick={() => setSelectedDiagram(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body" style={{ background: "var(--bg-surface-subtle)", textAlign: "center" }}>
          {diagramLoadError[activeDiagram.id] ? (
            <div style={{ padding: 32, color: "var(--ink-secondary)", fontSize: "var(--text-sm)" }}>
              Diagram image unavailable at <code className="mono">{activeDiagram.src}</code>.
              Serve via FastAPI (<code className="mono">uvicorn app.main:app</code>) to inspect static diagrams.
            </div>
          ) : (
            <img
              src={activeDiagram.src}
              alt={activeDiagram.label}
              onError={() =>
                setDiagramLoadError((prev) => ({
                  ...prev,
                  [activeDiagram.id]: true,
                }))
              }
              style={{
                maxWidth: "100%",
                maxHeight: 540,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-hairline)",
                background: "#FFFFFF",
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
