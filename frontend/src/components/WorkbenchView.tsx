import { useEffect, useState } from "react";
import {
  LEAD_STATUSES,
  type Lead,
  type LeadIntelligenceBundle,
  type ScoreRequest,
  type WorkbenchTab,
} from "../types/sales";
import { FactorRadarChart } from "./FactorRadarChart";
import {
  AlertIcon,
  AnalysisPulseIcon,
  BuildingIcon,
  CheckIcon,
  CompassIcon,
  CopyIcon,
  EditIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshIcon,
  SlidersIcon,
  TrashIcon,
  UserIcon,
} from "./Icons";
import { QualificationArcGauge } from "./QualificationArcGauge";

interface WorkbenchViewProps {
  lead: Lead | null;
  leads: Lead[];
  intel: LeadIntelligenceBundle | undefined;
  activeTab: WorkbenchTab;
  onChangeTab: (tab: WorkbenchTab) => void;
  onSelectLead: (leadId: number) => void;
  onUpdateStage: (leadId: number, status: string) => Promise<void>;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => Promise<void>;
  onRunAnalysis: (leadId: number) => Promise<void>;
  onSubmitScore: (leadId: number, payload: ScoreRequest) => Promise<void>;
  onGenerateEmail: (
    leadId: number,
    payload: { tone: string; service_offered: string; additional_context?: string }
  ) => Promise<void>;
  onGenerateRecommendation: (leadId: number) => Promise<void>;
  onQuickSaveEmail: (leadId: number, email: string) => Promise<void>;
  onNotify: (msg: string) => void;
}

const SCORE_FACTORS: Array<{
  key: keyof ScoreRequest;
  label: string;
  hint: string;
}> = [
  {
    key: "company_growth",
    label: "Company Growth Trajectory",
    hint: "Funding velocity, headcount expansion, market momentum",
  },
  {
    key: "industry_match",
    label: "Ideal Industry Match",
    hint: "Alignment with core vertical experience & regulatory readiness",
  },
  {
    key: "technology_alignment",
    label: "Technology Stack Alignment",
    hint: "Compatibility across cloud, data pipeline, and modern APIs",
  },
  {
    key: "business_need",
    label: "Urgency of Business Need",
    hint: "Explicit modernization pain points or operational bottlenecks",
  },
  {
    key: "engagement_level",
    label: "Buyer Engagement Level",
    hint: "Responsiveness, stakeholder access, and budget sponsorship",
  },
];

const EMAIL_TONES = [
  "professional",
  "consultative",
  "executive brief",
  "friendly",
  "technical",
];

function parseMultiline(raw: string): string[] {
  return raw
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

export function WorkbenchView({
  lead,
  leads,
  intel,
  activeTab,
  onChangeTab,
  onSelectLead,
  onUpdateStage,
  onEditLead,
  onDeleteLead,
  onRunAnalysis,
  onSubmitScore,
  onGenerateEmail,
  onGenerateRecommendation,
  onQuickSaveEmail,
  onNotify,
}: WorkbenchViewProps) {
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [scoreDraft, setScoreDraft] = useState<ScoreRequest>({
    company_growth: 7,
    industry_match: 7,
    technology_alignment: 7,
    business_need: 7,
    engagement_level: 6,
  });
  const [savingScore, setSavingScore] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  const [tone, setTone] = useState("professional");
  const [serviceOffered, setServiceOffered] = useState(
    "AI-enabled software architecture, data pipeline engineering, and enterprise automation"
  );
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [quickEmailInput, setQuickEmailInput] = useState("");
  const [savingQuickEmail, setSavingQuickEmail] = useState(false);

  const [generatingRec, setGeneratingRec] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const savedScore = intel?.score ?? null;
  const savedAnalysis = intel?.analysis ?? null;
  const savedEmails = intel?.emails ?? [];
  const savedRec = intel?.recommendation ?? null;

  useEffect(() => {
    setAnalysisError(null);
    setScoreError(null);
    setEmailError(null);
    setRecError(null);
    setQuickEmailInput(lead?.email ?? "");

    if (savedScore) {
      setScoreDraft({
        company_growth: savedScore.company_growth,
        industry_match: savedScore.industry_match,
        technology_alignment: savedScore.technology_alignment,
        business_need: savedScore.business_need,
        engagement_level: savedScore.engagement_level,
      });
    } else {
      setScoreDraft({
        company_growth: 7,
        industry_match: 7,
        technology_alignment: 6,
        business_need: 7,
        engagement_level: 5,
      });
    }
  }, [lead?.id, savedScore?.id]);

  if (!lead) {
    return (
      <div className="panel panel-body">
        <div className="empty-state">
          <h2 className="empty-state-title">Select a prospect to open the workbench</h2>
          <p className="empty-state-desc">
            Choose any account from the pipeline table or directory to run AI
            company intelligence, calibrate ML conversion scores, and compose
            outreach.
          </p>
        </div>
      </div>
    );
  }

  const liveWeightedScore = Math.round(
    ((scoreDraft.company_growth +
      scoreDraft.industry_match +
      scoreDraft.technology_alignment +
      scoreDraft.business_need +
      scoreDraft.engagement_level) /
      50) *
      100
  );
  const livePriority =
    liveWeightedScore >= 80
      ? "High"
      : liveWeightedScore >= 50
        ? "Medium"
        : "Low";

  const copyText = async (key: string, text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      onNotify(`${label} copied to clipboard`);
      setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 1800);
    } catch {
      onNotify("Clipboard permission unavailable");
    }
  };

  const handleRunAnalysis = async () => {
    setRunningAnalysis(true);
    setAnalysisError(null);
    try {
      await onRunAnalysis(lead.id);
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "Failed to run AI company analysis."
      );
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleSaveScore = async () => {
    setSavingScore(true);
    setScoreError(null);
    try {
      await onSubmitScore(lead.id, scoreDraft);
    } catch (err) {
      setScoreError(
        err instanceof Error ? err.message : "Failed to predict conversion score."
      );
    } finally {
      setSavingScore(false);
    }
  };

  const handleGenerateEmail = async () => {
    setGeneratingEmail(true);
    setEmailError(null);
    try {
      await onGenerateEmail(lead.id, {
        tone,
        service_offered: serviceOffered.trim() || "Software development and technology solutions",
        additional_context: additionalContext.trim() || undefined,
      });
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Failed to generate outreach email."
      );
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleGenerateRec = async () => {
    setGeneratingRec(true);
    setRecError(null);
    try {
      await onGenerateRecommendation(lead.id);
    } catch (err) {
      setRecError(
        err instanceof Error ? err.message : "Failed to generate outreach strategy."
      );
    } finally {
      setGeneratingRec(false);
    }
  };

  const stackTags = (lead.technology_stack ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div>
      {/* Account Context Header */}
      <section className="panel workbench-header" aria-label="Selected account summary">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <select
              aria-label="Switch active account"
              className="form-select"
              style={{ width: "auto", minWidth: 230, fontWeight: 700 }}
              value={lead.id}
              onChange={(e) => onSelectLead(Number(e.target.value))}
            >
              {leads.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.company_name} ({item.status})
                </option>
              ))}
            </select>

            <span className={`stage-badge stage-${lead.status.toLowerCase()}`}>
              {lead.status}
            </span>

            {savedScore && (
              <span className="tabular" style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--accent-ink)", background: "var(--accent-tint)", padding: "3px 10px", borderRadius: "var(--radius-pill)", border: "1px solid var(--accent-tint-border)" }}>
                Score {savedScore.total_score}/100 ·{" "}
                {typeof savedScore.conversation_probability === "number"
                  ? `${savedScore.conversation_probability.toFixed(1)}% ML Prob`
                  : savedScore.priority}
              </span>
            )}
          </div>

          <div className="workbench-meta-row">
            <span className="workbench-meta-item">
              <BuildingIcon size={14} />
              {lead.industry}
              {lead.employee_count ? ` (${lead.employee_count} employees)` : ""}
            </span>
            {lead.contact_person && (
              <span className="workbench-meta-item">
                <UserIcon size={14} />
                {lead.contact_person}
              </span>
            )}
            {lead.location && (
              <span className="workbench-meta-item">
                <MapPinIcon size={14} />
                {lead.location}
              </span>
            )}
            {lead.website && (
              <a
                href={
                  lead.website.startsWith("http")
                    ? lead.website
                    : `https://${lead.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="workbench-meta-item"
              >
                <GlobeIcon size={14} />
                {lead.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <select
            aria-label="Update pipeline stage"
            className="form-select"
            style={{ width: 140, height: 36 }}
            value={lead.status}
            onChange={(e) => void onUpdateStage(lead.id, e.target.value)}
          >
            {LEAD_STATUSES.map((st) => (
              <option key={st} value={st}>
                Stage: {st}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onEditLead(lead)}
          >
            <EditIcon size={15} />
            Edit
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (
                window.confirm(
                  `Delete ${lead.company_name} permanently?`
                )
              ) {
                void onDeleteLead(lead);
              }
            }}
          >
            <TrashIcon size={15} />
            Delete
          </button>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="workbench-tabs" role="tablist" aria-label="Account workbench tools">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "intelligence"}
          className={`workbench-tab ${activeTab === "intelligence" ? "is-active" : ""}`}
          onClick={() => onChangeTab("intelligence")}
        >
          <AnalysisPulseIcon size={16} />
          Company Intelligence
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "scoring"}
          className={`workbench-tab ${activeTab === "scoring" ? "is-active" : ""}`}
          onClick={() => onChangeTab("scoring")}
        >
          <SlidersIcon size={16} />
          ML Scoring &amp; Simulator
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "outreach"}
          className={`workbench-tab ${activeTab === "outreach" ? "is-active" : ""}`}
          onClick={() => onChangeTab("outreach")}
        >
          <MailIcon size={16} />
          Outreach &amp; Strategy ({savedEmails.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "profile"}
          className={`workbench-tab ${activeTab === "profile" ? "is-active" : ""}`}
          onClick={() => onChangeTab("profile")}
        >
          <BuildingIcon size={16} />
          Profile &amp; Stack
        </button>
      </div>

      {/* TAB 1: Company Intelligence */}
      {activeTab === "intelligence" && (
        <div>
          {analysisError && (
            <div className="alert-banner alert-error" role="alert">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertIcon size={16} />
                <span>{analysisError}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => void handleRunAnalysis()}
              >
                Retry analysis
              </button>
            </div>
          )}

          {runningAnalysis ? (
            <div className="two-col-grid">
              <div className="panel panel-body">
                <div className="skeleton" style={{ height: 24, width: "50%", marginBottom: 14 }} />
                <div className="skeleton" style={{ height: 96, marginBottom: 18 }} />
                <div className="skeleton" style={{ height: 24, width: "45%", marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 84 }} />
              </div>
              <div className="panel panel-body">
                <div className="skeleton" style={{ height: 140, marginBottom: 18 }} />
                <div className="skeleton" style={{ height: 110 }} />
              </div>
            </div>
          ) : !savedAnalysis ? (
            <div className="panel panel-body">
              <div className="empty-state">
                <AnalysisPulseIcon size={32} style={{ color: "var(--accent)" }} />
                <h3 className="empty-state-title">
                  No AI company intelligence brief generated yet
                </h3>
                <p className="empty-state-desc">
                  Synthesize {lead.company_name}'s industry positioning, likely
                  business needs, commercial opportunities, and an initial
                  0–100 qualification rating from saved account data.
                </p>
                <div className="empty-state-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void handleRunAnalysis()}
                  >
                    <AnalysisPulseIcon size={15} />
                    Generate AI Intelligence Brief
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="workbench-split">
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h3 className="panel-title">Executive Company Overview</h3>
                      <p className="panel-subtitle tabular">
                        Generated {new Date(savedAnalysis.generated_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => void handleRunAnalysis()}
                    >
                      <RefreshIcon size={14} />
                      Refresh brief
                    </button>
                  </div>
                  <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                      <h4 style={{ margin: "0 0 6px", fontSize: "var(--text-sm)", color: "var(--ink-secondary)" }}>
                        Company summary
                      </h4>
                      <p className="prose-block">{savedAnalysis.company_overview}</p>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 16 }}>
                      <h4 style={{ margin: "0 0 6px", fontSize: "var(--text-sm)", color: "var(--ink-secondary)" }}>
                        Industry &amp; market dynamics
                      </h4>
                      <p className="prose-block">{savedAnalysis.industry_analysis}</p>
                    </div>
                  </div>
                </section>

                <div className="two-col-grid">
                  <section className="panel">
                    <div className="panel-header">
                      <h3 className="panel-title">Identified Business Needs</h3>
                    </div>
                    <div className="panel-body">
                      <ul className="bullet-list">
                        {parseMultiline(savedAnalysis.business_needs).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  <section className="panel">
                    <div className="panel-header">
                      <h3 className="panel-title">Sales Opportunities</h3>
                    </div>
                    <div className="panel-body">
                      <ul className="bullet-list">
                        {parseMultiline(savedAnalysis.opportunities).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </section>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <section className="panel">
                  <div className="panel-header">
                    <h3 className="panel-title">AI Qualification Rating</h3>
                  </div>
                  <div className="panel-body">
                    <QualificationArcGauge score={savedAnalysis.qualification_score} />
                    <div
                      style={{
                        marginTop: 18,
                        padding: 14,
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-surface-subtle)",
                        border: "1px solid var(--border-hairline)",
                      }}
                    >
                      <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-secondary)", marginBottom: 4 }}>
                        Recommended next action
                      </div>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-primary)" }}>
                        {savedAnalysis.recommended_action}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ML Scoring & Simulator */}
      {activeTab === "scoring" && (
        <div className="workbench-split">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">5-Factor Deal Qualification &amp; ML Scoring</h3>
                <p className="panel-subtitle">
                  Calibrate scores (0–10) and run the scikit-learn RandomForest conversion classifier
                </p>
              </div>
            </div>
            <div className="panel-body">
              {scoreError && (
                <div className="alert-banner alert-error" role="alert">
                  <span>{scoreError}</span>
                </div>
              )}

              {SCORE_FACTORS.map((factor) => {
                const val = scoreDraft[factor.key];
                return (
                  <div key={factor.key} className="slider-row">
                    <div className="slider-header">
                      <div>
                        <label
                          htmlFor={`slider-${factor.key}`}
                          style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}
                        >
                          {factor.label}
                        </label>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                          {factor.hint}
                        </div>
                      </div>
                      <span
                        className="tabular mono"
                        style={{
                          fontWeight: 700,
                          fontSize: "var(--text-md)",
                          color: "var(--accent-ink)",
                          minWidth: 38,
                          textAlign: "right",
                        }}
                      >
                        {val}/10
                      </span>
                    </div>
                    <input
                      id={`slider-${factor.key}`}
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      className="slider-input"
                      value={val}
                      onChange={(e) =>
                        setScoreDraft((prev) => ({
                          ...prev,
                          [factor.key]: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                );
              })}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border-hairline)",
                }}
              >
                <div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                    Draft deterministic total
                  </div>
                  <div className="tabular" style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>
                    {liveWeightedScore}/100 ({livePriority} priority)
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={savingScore}
                  onClick={() => void handleSaveScore()}
                >
                  {savingScore ? "Predicting..." : "Predict & Save ML Score"}
                </button>
              </div>
            </div>
          </section>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Factor Footprint Radar</h3>
                  <p className="panel-subtitle">
                    Solid cobalt: live sliders · Dashed slate: last persisted score
                  </p>
                </div>
              </div>
              <div className="panel-body">
                <FactorRadarChart
                  draft={scoreDraft}
                  baseline={
                    savedScore
                      ? {
                          company_growth: savedScore.company_growth,
                          industry_match: savedScore.industry_match,
                          technology_alignment: savedScore.technology_alignment,
                          business_need: savedScore.business_need,
                          engagement_level: savedScore.engagement_level,
                        }
                      : null
                  }
                />
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title">Persisted RandomForest Prediction</h3>
              </div>
              <div className="panel-body">
                {savedScore ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-hairline)" }}>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                          ML Conv. Prob.
                        </div>
                        <div className="tabular" style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--accent-ink)" }}>
                          {typeof savedScore.conversation_probability === "number"
                            ? `${savedScore.conversation_probability.toFixed(1)}%`
                            : "N/A"}
                        </div>
                      </div>
                      <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-hairline)" }}>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                          Weighted Score
                        </div>
                        <div className="tabular" style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>
                          {savedScore.total_score}/100
                        </div>
                      </div>
                      <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-hairline)" }}>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                          Priority Tier
                        </div>
                        <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginTop: 2 }}>
                          {savedScore.priority}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <span>
                        Source: <code className="mono">{savedScore.probability_source}</code>
                      </span>
                      <span className="tabular">
                        Saved {new Date(savedScore.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-secondary)" }}>
                    Adjust the five qualification sliders and click{" "}
                    <strong>Predict &amp; Save ML Score</strong> to persist a
                    RandomForest conversion probability for this account.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 3: Outreach Studio & Next-Best-Action Strategy */}
      {activeTab === "outreach" && (
        <div className="workbench-split">
          {/* Left: Personalized Email Composer */}
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Personalized AI Outreach Composer</h3>
                <p className="panel-subtitle">
                  Generate and archive context-grounded B2B outreach drafts
                </p>
              </div>
            </div>
            <div className="panel-body">
              {!lead.email && (
                <div className="alert-banner alert-caution" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <div>
                    <strong>Recipient email required before saving a draft.</strong>{" "}
                    Add {lead.company_name}'s work email right here to unlock
                    AI email generation:
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="contact@company.com"
                      value={quickEmailInput}
                      onChange={(e) => setQuickEmailInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={savingQuickEmail || !quickEmailInput.trim()}
                      onClick={async () => {
                        setSavingQuickEmail(true);
                        try {
                          await onQuickSaveEmail(lead.id, quickEmailInput.trim());
                        } finally {
                          setSavingQuickEmail(false);
                        }
                      }}
                    >
                      {savingQuickEmail ? "Saving..." : "Save email"}
                    </button>
                  </div>
                </div>
              )}

              {emailError && (
                <div className="alert-banner alert-error" role="alert">
                  <span>{emailError}</span>
                </div>
              )}

              <div className="form-grid" style={{ marginBottom: 16 }}>
                <label className="form-field">
                  <span className="form-label">Communication tone</span>
                  <select
                    className="form-select"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    {EMAIL_TONES.map((t) => (
                      <option key={t} value={t}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">Recipient address</span>
                  <input
                    className="form-input"
                    type="text"
                    readOnly
                    value={lead.email || "No email on record"}
                    style={{ background: "var(--bg-surface-subtle)" }}
                  />
                </label>

                <label className="form-field is-full">
                  <span className="form-label">Service / value proposition offered</span>
                  <input
                    className="form-input"
                    type="text"
                    value={serviceOffered}
                    onChange={(e) => setServiceOffered(e.target.value)}
                  />
                </label>

                <label className="form-field is-full">
                  <span className="form-label">Additional campaign context (optional)</span>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 74 }}
                    placeholder="Mention Q1 modernization roadmap, compliance focus, or recent trigger event..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                  />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={generatingEmail || !lead.email}
                  onClick={() => void handleGenerateEmail()}
                >
                  <MailIcon size={15} />
                  {generatingEmail ? "Drafting outreach..." : "Generate Personalized Draft"}
                </button>
              </div>

              <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", fontWeight: 700 }}>
                  Saved Draft History ({savedEmails.length})
                </h4>

                {savedEmails.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-muted)" }}>
                    No outreach drafts generated for {lead.company_name} yet.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {savedEmails.map((em) => (
                      <article
                        key={em.id}
                        style={{
                          border: "1px solid var(--border-hairline)",
                          borderRadius: "var(--radius-md)",
                          background: "var(--bg-surface-subtle)",
                          padding: 14,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>
                              {em.subject}
                            </div>
                            <div className="tabular" style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)", marginTop: 2 }}>
                              To: {em.recipient} · Tone: {em.tone} ·{" "}
                              {new Date(em.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                void copyText(
                                  `email-${em.id}`,
                                  `Subject: ${em.subject}\n\n${em.body}`,
                                  "Email draft"
                                )
                              }
                            >
                              {copiedId === `email-${em.id}` ? (
                                <CheckIcon size={13} />
                              ) : (
                                <CopyIcon size={13} />
                              )}
                              {copiedId === `email-${em.id}` ? "Copied" : "Copy"}
                            </button>
                            <a
                              className="btn btn-secondary btn-sm"
                              href={`mailto:${encodeURIComponent(em.recipient)}?subject=${encodeURIComponent(em.subject)}&body=${encodeURIComponent(em.body)}`}
                              style={{ textDecoration: "none" }}
                            >
                              Open mail
                            </a>
                          </div>
                        </div>

                        <pre
                          style={{
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            fontFamily: "var(--font-sans)",
                            fontSize: "var(--text-sm)",
                            lineHeight: 1.6,
                            color: "var(--ink-primary)",
                            maxWidth: "70ch",
                          }}
                        >
                          {em.body}
                        </pre>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right: Outreach Recommendation Engine */}
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Outreach Strategy Recommendation</h3>
                <p className="panel-subtitle">
                  Channel, follow-up cadence, and next action grounded in lead score
                </p>
              </div>
            </div>
            <div className="panel-body">
              {recError && (
                <div className="alert-banner alert-error" role="alert">
                  <span>{recError}</span>
                </div>
              )}

              {!savedScore ? (
                <div className="alert-banner alert-info" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <div>
                    <strong>Lead score required first.</strong> Next-best-action
                    recommendations depend on a persisted 5-factor score and
                    priority tier.
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onChangeTab("scoring")}
                  >
                    <SlidersIcon size={14} />
                    Go to ML Scoring Simulator
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={generatingRec}
                    onClick={() => void handleGenerateRec()}
                  >
                    <CompassIcon size={15} />
                    {generatingRec
                      ? "Generating strategy..."
                      : savedRec
                        ? "Regenerate Strategy"
                        : "Generate Next-Best-Action Strategy"}
                  </button>
                </div>
              )}

              {savedRec ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="two-col-grid">
                    <div style={{ padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border-hairline)", background: "var(--bg-surface-subtle)" }}>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                        Recommended channel
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "var(--text-md)", marginTop: 2 }}>
                        {savedRec.channel}
                      </div>
                    </div>
                    <div style={{ padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border-hairline)", background: "var(--bg-surface-subtle)" }}>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                        Follow-up cadence
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "var(--text-md)", marginTop: 2 }}>
                        {savedRec.follow_up_timing}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 14, borderRadius: "var(--radius-md)", border: "1px solid var(--border-hairline)" }}>
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-secondary)", marginBottom: 4 }}>
                      Engagement strategy
                    </div>
                    <p className="prose-block" style={{ fontSize: "var(--text-sm)" }}>
                      {savedRec.strategy}
                    </p>
                  </div>

                  <div style={{ padding: 14, borderRadius: "var(--radius-md)", border: "1px solid var(--accent-tint-border)", background: "var(--accent-tint)" }}>
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--accent-ink)", marginBottom: 4 }}>
                      Immediate next action
                    </div>
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-primary)", fontWeight: 500 }}>
                      {savedRec.next_action}
                    </p>
                  </div>
                </div>
              ) : savedScore ? (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-muted)" }}>
                  Click the button above to compute an AI-assisted outreach
                  channel, timing, and next-step recommendation from{" "}
                  <strong>{lead.company_name}</strong>'s score ({savedScore.total_score}/100).
                </p>
              ) : null}
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: Profile & Stack */}
      {activeTab === "profile" && (
        <div className="two-col-grid">
          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title">Account Profile &amp; Notes</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onEditLead(lead)}
              >
                <EditIcon size={14} />
                Edit details
              </button>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-muted)", marginBottom: 6 }}>
                  Company notes &amp; deal context
                </div>
                <p className="prose-block" style={{ fontSize: "var(--text-sm)" }}>
                  {lead.description || "No company notes recorded yet."}
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 14 }}>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-muted)", marginBottom: 8 }}>
                  Technology stack
                </div>
                {stackTags.length > 0 ? (
                  <div className="tech-tags">
                    {stackTags.map((tag) => (
                      <span key={tag} className="tech-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-muted)" }}>
                    Not recorded
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title">Contact Metadata &amp; Timestamps</h3>
            </div>
            <div className="ledger-rows">
              <div className="ledger-row">
                <span className="ledger-row-label">Primary contact</span>
                <span style={{ fontWeight: 600 }}>{lead.contact_person || "—"}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-row-label">Email</span>
                <span style={{ fontWeight: 600 }}>{lead.email || "—"}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-row-label">Phone</span>
                <span style={{ fontWeight: 600 }} className="tabular">
                  {lead.phone ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <PhoneIcon size={13} />
                      {lead.phone}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="ledger-row">
                <span className="ledger-row-label">Created</span>
                <span className="tabular" style={{ fontSize: "var(--text-sm)" }}>
                  {new Date(lead.created_at).toLocaleString()}
                </span>
              </div>
              <div className="ledger-row">
                <span className="ledger-row-label">Last updated</span>
                <span className="tabular" style={{ fontSize: "var(--text-sm)" }}>
                  {new Date(lead.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
