import { useState, type FormEvent } from "react";
import {
  AnalysisPulseIcon,
  ArrowRightIcon,
  BrandEmblem,
  CheckIcon,
  CloseIcon,
  DirectoryIcon,
  ForecastIcon,
  LockIcon,
  MailIcon,
  ModelIcon,
  ShieldCheckIcon,
  SlidersIcon,
  WorkbenchIcon,
} from "./Icons";
import type { WorkspaceView } from "../types/sales";

interface LandingPageProps {
  apiStatus: "checking" | "online" | "degraded";
  leadCount: number;
  scoredCount: number;
  analyzedCount: number;
  operatorEmail: string | null;
  onEnterWorkspace: (view?: WorkspaceView, operatorEmail?: string | null) => void;
}

interface WorkflowStageSpec {
  id: string;
  step: string;
  title: string;
  endpoint: string;
  summary: string;
  inputs: string[];
  outputs: { key: string; value: string; accent?: "blue" | "green" }[];
}

const WORKFLOW_STAGES: WorkflowStageSpec[] = [
  {
    id: "ingest",
    step: "01",
    title: "Capture & Structure B2B Accounts",
    endpoint: "POST /api/leads/",
    summary:
      "Register prospect firmographics, headcount, location, primary contact, and technology stack into a normalized relational pipeline.",
    inputs: [
      "company_name, industry, status",
      "employee_count, location, website",
      "technology_stack & account notes",
    ],
    outputs: [
      { key: "record.status", value: "Qualified", accent: "blue" },
      { key: "record.stack", value: "Snowflake, Python, AWS" },
      { key: "storage.sync", value: "PostgreSQL / SQLite", accent: "green" },
    ],
  },
  {
    id: "analysis",
    step: "02",
    title: "Generate Gemini Intelligence Brief",
    endpoint: "POST /api/analysis/{lead_id}",
    summary:
      "Synthesize an executive account brief covering business bottlenecks, expansion opportunities, vertical context, and an automated fit score.",
    inputs: [
      "Company profile & description",
      "Detected cloud & data stack",
      "Industry context window",
    ],
    outputs: [
      { key: "qualification_score", value: "86 / 100", accent: "green" },
      { key: "business_needs", value: "Pipeline telemetry & ML churn alerts" },
      { key: "recommended_action", value: "Executive discovery w/ VP Ops", accent: "blue" },
    ],
  },
  {
    id: "scoring",
    step: "03",
    title: "Predict Conversion with RandomForest",
    endpoint: "POST /api/scoring/predict/{lead_id}",
    summary:
      "Evaluate 5 validated 0–10 signals against the trained scikit-learn estimator to calibrate win probability and assign triage priority.",
    inputs: [
      "company_growth · industry_match",
      "technology_alignment · business_need",
      "engagement_level (0–10 scale)",
    ],
    outputs: [
      { key: "total_score", value: "87 / 100", accent: "blue" },
      { key: "priority", value: "High", accent: "green" },
      { key: "conversation_probability", value: "88.4%", accent: "green" },
    ],
  },
  {
    id: "outreach",
    step: "04",
    title: "Compose Stage-Calibrated Outreach",
    endpoint: "POST /api/outreach/generate-email/{lead_id}",
    summary:
      "Draft personalized outreach anchored to the company's AI brief and ML score, paired with channel and follow-up timing recommendations.",
    inputs: [
      "Tone (Consultative / Executive / Direct)",
      "Service offering & value proposition",
      "Latest AI brief & ML priority",
    ],
    outputs: [
      { key: "recommended_channel", value: "Direct Email + LinkedIn Brief", accent: "blue" },
      { key: "follow_up_timing", value: "Within 24 hours" },
      { key: "draft_saved", value: "Persisted to lead history", accent: "green" },
    ],
  },
];

const FEATURE_CONTRACT = [
  {
    key: "company_growth",
    range: "0 – 10",
    desc: "Revenue trajectory, headcount velocity, and expansion signals",
  },
  {
    key: "industry_match",
    range: "0 – 10",
    desc: "Alignment with core B2B vertical specialization and ICP fit",
  },
  {
    key: "technology_alignment",
    range: "0 – 10",
    desc: "Modern cloud, warehouse, and API stack compatibility",
  },
  {
    key: "business_need",
    range: "0 – 10",
    desc: "Urgency and clarity of operational forecasting pain points",
  },
  {
    key: "engagement_level",
    range: "0 – 10",
    desc: "Executive sponsorship and buyer responsiveness",
  },
];

function HeroForecastBlueprintSvg() {
  return (
    <div className="landing-blueprint-card">
      <div className="landing-blueprint-chrome">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="landing-chrome-dot" style={{ background: "#1B4DFF" }} />
          <span className="mono" style={{ fontSize: "11px", color: "var(--ink-secondary)", fontWeight: 600 }}>
            CALIBRATION WORKSPACE · PREVIEW
          </span>
        </div>
        <span className="mono" style={{ fontSize: "11px", color: "var(--signal-positive)", fontWeight: 600 }}>
          RF MODEL · 200 TREES
        </span>
      </div>

      <svg
        viewBox="0 0 540 340"
        className="landing-hero-svg"
        role="img"
        aria-label="SalesGenie AI pipeline calibration and ML win probability interface blueprint"
      >
        <defs>
          <pattern id="landing-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#EAECE6" strokeWidth="0.75" />
          </pattern>
        </defs>

        <rect width="540" height="340" fill="#FAF9F6" />
        <rect width="540" height="340" fill="url(#landing-grid)" opacity="0.7" />

        {/* Left panel: Stage Funnel */}
        <g transform="translate(18, 18)">
          <rect width="164" height="304" rx="8" fill="#FFFFFF" stroke="#E1E3DD" strokeWidth="1.1" />
          <text x="14" y="24" fontFamily="Public Sans, sans-serif" fontSize="11" fontWeight="700" fill="#111820">
            Pipeline Stages
          </text>
          <text x="14" y="39" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#5F6C7B">
            LIVE COHORT MIX
          </text>
          <line x1="14" y1="50" x2="150" y2="50" stroke="#E1E3DD" strokeWidth="1" />

          {[
            { label: "Proposal", count: "03", w: 96, color: "#9F5205", y: 70 },
            { label: "Qualified", count: "04", w: 118, color: "#1B4DFF", y: 116 },
            { label: "Contacted", count: "02", w: 72, color: "#1849A9", y: 162 },
            { label: "Won", count: "02", w: 68, color: "#0E7454", y: 208 },
          ].map((row) => (
            <g key={row.label} transform={`translate(14, ${row.y})`}>
              <text x="0" y="0" fontFamily="Public Sans, sans-serif" fontSize="10.5" fontWeight="600" fill="#475467">
                {row.label}
              </text>
              <text x="136" y="0" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10.5" fontWeight="600" fill="#111820">
                {row.count}
              </text>
              <rect x="0" y="8" width="136" height="7" rx="3.5" fill="#F1F2EE" />
              <rect x="0" y="8" width={row.w} height="7" rx="3.5" fill={row.color} />
            </g>
          ))}

          {/* Bottom mini summary */}
          <rect x="14" y="248" width="136" height="42" rx="6" fill="#EEF3FF" stroke="#C4D5FD" strokeWidth="1" />
          <text x="24" y="265" fontFamily="Public Sans, sans-serif" fontSize="9.5" fontWeight="600" fill="#1032AD">
            High-Priority Queue
          </text>
          <text x="24" y="281" fontFamily="JetBrains Mono, monospace" fontSize="11.5" fontWeight="600" fill="#1032AD">
            Score ≥ 80 · 4 Accts
          </text>
        </g>

        {/* Right top panel: Calibration Scatter Plot */}
        <g transform="translate(196, 18)">
          <rect width="326" height="198" rx="8" fill="#FFFFFF" stroke="#E1E3DD" strokeWidth="1.1" />
          <text x="16" y="24" fontFamily="Public Sans, sans-serif" fontSize="11" fontWeight="700" fill="#111820">
            Score vs. ML Conversion Probability
          </text>
          <text x="310" y="24" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#5F6C7B">
            CALIBRATED
          </text>

          {/* Plot grid */}
          <line x1="42" y1="46" x2="42" y2="164" stroke="#C6CAC0" strokeWidth="1" />
          <line x1="42" y1="164" x2="306" y2="164" stroke="#C6CAC0" strokeWidth="1" />
          <line x1="42" y1="105" x2="306" y2="105" stroke="#E1E3DD" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="174" y1="46" x2="174" y2="164" stroke="#E1E3DD" strokeDasharray="3 3" strokeWidth="1" />

          {/* Ideal calibration diagonal */}
          <line x1="46" y1="160" x2="300" y2="52" stroke="#C4D5FD" strokeWidth="1.5" strokeDasharray="4 3" />

          {/* Axis labels */}
          <text x="36" y="54" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#5F6C7B">
            95%
          </text>
          <text x="36" y="108" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#5F6C7B">
            50%
          </text>
          <text x="36" y="164" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#5F6C7B">
            10%
          </text>
          <text x="174" y="182" textAnchor="middle" fontFamily="Public Sans, sans-serif" fontSize="9.5" fill="#5F6C7B">
            Weighted Heuristic Lead Score (0–100)
          </text>

          {/* Scatter points */}
          <circle cx="96" cy="144" r="4.5" fill="#5F6C7B" opacity="0.7" />
          <circle cx="136" cy="126" r="5" fill="#1849A9" opacity="0.85" />
          <circle cx="192" cy="101" r="5.5" fill="#9F5205" />
          <circle cx="222" cy="88" r="5.5" fill="#1B4DFF" />
          <circle cx="258" cy="70" r="6" fill="#0E7454" />

          {/* Highlighted active node + precision callout */}
          <circle cx="282" cy="58" r="11" fill="#0E7454" opacity="0.14" />
          <circle cx="282" cy="58" r="5.5" fill="#0E7454" stroke="#FFFFFF" strokeWidth="1.5" />

          <g transform="translate(154, 42)">
            <rect width="118" height="36" rx="5" fill="#111820" />
            <text x="10" y="15" fontFamily="Public Sans, sans-serif" fontSize="9.5" fontWeight="700" fill="#FFFFFF">
              Apex Photonics
            </text>
            <text x="10" y="28" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#A7F3D0">
              Win Prob 88.4% · High
            </text>
          </g>
        </g>

        {/* Right bottom panel: 3 live readout cards */}
        <g transform="translate(196, 228)">
          <rect width="102" height="94" rx="8" fill="#FFFFFF" stroke="#E1E3DD" strokeWidth="1.1" />
          <text x="12" y="22" fontFamily="Public Sans, sans-serif" fontSize="10" fontWeight="600" fill="#5F6C7B">
            AI Fit Score
          </text>
          <text x="12" y="54" fontFamily="JetBrains Mono, monospace" fontSize="22" fontWeight="600" fill="#111820">
            86
          </text>
          <text x="48" y="54" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#5F6C7B">
            /100
          </text>
          <rect x="12" y="68" width="78" height="14" rx="3" fill="#EEF3FF" />
          <text x="51" y="78" textAnchor="middle" fontFamily="Public Sans, sans-serif" fontSize="8.5" fontWeight="600" fill="#1032AD">
            Gemini Brief
          </text>
        </g>

        <g transform="translate(308, 228)">
          <rect width="102" height="94" rx="8" fill="#FFFFFF" stroke="#E1E3DD" strokeWidth="1.1" />
          <text x="12" y="22" fontFamily="Public Sans, sans-serif" fontSize="10" fontWeight="600" fill="#5F6C7B">
            ML Win Prob
          </text>
          <text x="12" y="54" fontFamily="JetBrains Mono, monospace" fontSize="20" fontWeight="600" fill="#0E7454">
            88.4%
          </text>
          <rect x="12" y="68" width="78" height="14" rx="3" fill="#EAF7F1" />
          <text x="51" y="78" textAnchor="middle" fontFamily="Public Sans, sans-serif" fontSize="8.5" fontWeight="600" fill="#0E7454">
            High Priority
          </text>
        </g>

        <g transform="translate(420, 228)">
          <rect width="102" height="94" rx="8" fill="#FFFFFF" stroke="#E1E3DD" strokeWidth="1.1" />
          <text x="12" y="22" fontFamily="Public Sans, sans-serif" fontSize="10" fontWeight="600" fill="#5F6C7B">
            Next Action
          </text>
          <text x="12" y="45" fontFamily="Public Sans, sans-serif" fontSize="11" fontWeight="700" fill="#111820">
            Executive
          </text>
          <text x="12" y="59" fontFamily="Public Sans, sans-serif" fontSize="11" fontWeight="700" fill="#111820">
            Brief Ready
          </text>
          <rect x="12" y="68" width="78" height="14" rx="3" fill="#F1F2EE" />
          <text x="51" y="78" textAnchor="middle" fontFamily="Public Sans, sans-serif" fontSize="8.5" fontWeight="600" fill="#475467">
            Draft Synced
          </text>
        </g>
      </svg>
    </div>
  );
}

function ScoringEngineBlueprintSvg() {
  // Pure SVG 5-factor pentagon radar chart illustrating the ML contract
  const cx = 148;
  const cy = 128;
  const radius = 82;
  const factors = [
    { label: "Growth", score: 0.9, angle: -90 },
    { label: "Industry Fit", score: 0.85, angle: -18 },
    { label: "Tech Stack", score: 0.8, angle: 54 },
    { label: "Need", score: 0.92, angle: 126 },
    { label: "Engagement", score: 0.78, angle: 198 },
  ];

  const pointAt = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
  };

  const ringPolys = [0.25, 0.5, 0.75, 1].map((scale) =>
    factors
      .map((f) => pointAt(radius * scale, f.angle).map((n) => n.toFixed(1)).join(","))
      .join(" ")
  );

  const dataPoly = factors
    .map((f) => pointAt(radius * f.score, f.angle).map((n) => n.toFixed(1)).join(","))
    .join(" ");

  return (
    <svg
      viewBox="0 0 300 264"
      className="landing-radar-svg"
      role="img"
      aria-label="5-factor RandomForest feature radar illustration"
    >
      <rect width="300" height="264" rx="8" fill="#FAF9F6" stroke="#E1E3DD" strokeWidth="1" />
      <text x="16" y="22" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="600" fill="#5F6C7B">
        5-FACTOR SIGNAL POLYGON
      </text>

      {ringPolys.map((pts, idx) => (
        <polygon
          key={idx}
          points={pts}
          fill="none"
          stroke={idx === 3 ? "#C6CAC0" : "#E1E3DD"}
          strokeWidth="1"
        />
      ))}

      {factors.map((f) => {
        const [x2, y2] = pointAt(radius, f.angle);
        const [lx, ly] = pointAt(radius + 19, f.angle);
        return (
          <g key={f.label}>
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#E1E3DD" strokeWidth="1" />
            <text
              x={lx}
              y={ly + 3}
              textAnchor="middle"
              fontFamily="Public Sans, sans-serif"
              fontSize="10"
              fontWeight="600"
              fill="#475467"
            >
              {f.label}
            </text>
          </g>
        );
      })}

      <polygon points={dataPoly} fill="#1B4DFF" fillOpacity="0.14" stroke="#1B4DFF" strokeWidth="2" />

      {factors.map((f) => {
        const [px, py] = pointAt(radius * f.score, f.angle);
        return (
          <circle
            key={f.label}
            cx={px}
            cy={py}
            r="3.8"
            fill="#FFFFFF"
            stroke="#1B4DFF"
            strokeWidth="1.8"
          />
        );
      })}

      <text x="16" y="248" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="600" fill="#0E7454">
        OUTPUT: TOTAL 85/100 · WIN PROB 88.4%
      </text>
    </svg>
  );
}

export function LandingPage({
  apiStatus,
  leadCount,
  scoredCount,
  analyzedCount,
  operatorEmail,
  onEnterWorkspace,
}: LandingPageProps) {
  const [activeStageId, setActiveStageId] = useState<string>("ingest");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState(operatorEmail ?? "");
  const [passcodeInput, setPasscodeInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const activeStage =
    WORKFLOW_STAGES.find((s) => s.id === activeStageId) ?? WORKFLOW_STAGES[0];

  const handleSignInSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setAuthError("Enter a valid work email address to sign in.");
      return;
    }
    setAuthError(null);
    setAuthModalOpen(false);
    onEnterWorkspace("forecast", trimmed);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="landing-page">
      {/* Sticky Public Entry Navigation */}
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <a
            href="#top"
            className="landing-brand"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <BrandEmblem size={30} />
            <span className="landing-brand-copy">
              <span className="landing-brand-name">SalesGenie AI</span>
              <span className="landing-brand-tag mono">v1.0 · REVENUE OS</span>
            </span>
          </a>

          <nav className="landing-nav-links" aria-label="Platform overview sections">
            <button
              type="button"
              className="landing-nav-link"
              onClick={() => scrollToSection("workflow")}
            >
              Workflow
            </button>
            <button
              type="button"
              className="landing-nav-link"
              onClick={() => scrollToSection("scoring")}
            >
              Scoring Engine
            </button>
            <button
              type="button"
              className="landing-nav-link"
              onClick={() => scrollToSection("architecture")}
            >
              Architecture
            </button>
          </nav>

          <div className="landing-nav-actions">
            <span
              className="landing-api-pill"
              title="FastAPI backend status"
            >
              <span
                className={`api-status-dot ${
                  apiStatus === "online"
                    ? "is-online"
                    : apiStatus === "degraded"
                      ? "is-degraded"
                      : "is-checking"
                }`}
              />
              <span>
                {apiStatus === "online"
                  ? "API Online"
                  : apiStatus === "degraded"
                    ? "Offline Mode"
                    : "Connecting"}
              </span>
            </span>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setAuthError(null);
                setAuthModalOpen(true);
              }}
            >
              <LockIcon size={14} />
              {operatorEmail ? "Switch Account" : "Sign In"}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onEnterWorkspace("forecast")}
            >
              Launch Workspace
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <div className="landing-eyebrow mono">
                FASTAPI · GEMINI INTELLIGENCE · SCIKIT-LEARN RANDOMFOREST
              </div>

              <h1 className="landing-hero-title">
                Turn raw B2B prospects into calibrated win forecasts.
              </h1>

              <p className="landing-hero-subtitle">
                SalesGenie AI unifies structured CRM lead ingestion, Gemini
                executive company briefs, 5-factor RandomForest conversion
                probability scoring, and stage-aware outreach drafting in one
                focused operator workspace.
              </p>

              <div className="landing-hero-cta">
                <button
                  type="button"
                  className="btn btn-primary landing-btn-lg"
                  onClick={() => onEnterWorkspace("forecast")}
                >
                  <ForecastIcon size={16} />
                  Launch Forecast Workspace
                  <ArrowRightIcon size={15} />
                </button>

                <button
                  type="button"
                  className="btn btn-secondary landing-btn-lg"
                  onClick={() => {
                    setAuthError(null);
                    setAuthModalOpen(true);
                  }}
                >
                  <LockIcon size={15} />
                  Operator Sign In
                </button>
              </div>

              <div className="landing-hero-meta">
                {apiStatus === "online" ? (
                  <>
                    <span className="landing-meta-chip">
                      <CheckIcon size={13} />
                      <span>
                        <strong className="tabular">{leadCount}</strong> prospects synced
                      </span>
                    </span>
                    <span className="landing-meta-chip">
                      <AnalysisPulseIcon size={13} />
                      <span>
                        <strong className="tabular">{analyzedCount}</strong> AI briefs
                      </span>
                    </span>
                    <span className="landing-meta-chip">
                      <SlidersIcon size={13} />
                      <span>
                        <strong className="tabular">{scoredCount}</strong> ML scored
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="landing-meta-chip">
                    <ShieldCheckIcon size={14} />
                    <span>Zero-bloat B2B forecasting · Ready for workspace entry</span>
                  </span>
                )}
              </div>
            </div>

            <HeroForecastBlueprintSvg />
          </div>
        </section>

        {/* 4-Column Architectural Spec Strip */}
        <section className="landing-spec-band" aria-label="Core platform capabilities">
          <div className="landing-container">
            <div className="landing-spec-grid">
              <div className="landing-spec-cell">
                <div className="landing-spec-head">
                  <span className="landing-spec-num mono">01</span>
                  <DirectoryIcon size={16} className="landing-spec-icon" />
                </div>
                <h2 className="landing-spec-title">Prospect Registry</h2>
                <p className="landing-spec-desc">
                  Full CRUD account records with firmographics, tech stack tags,
                  stage transitions, and CSV export.
                </p>
              </div>

              <div className="landing-spec-cell">
                <div className="landing-spec-head">
                  <span className="landing-spec-num mono">02</span>
                  <AnalysisPulseIcon size={16} className="landing-spec-icon" />
                </div>
                <h2 className="landing-spec-title">Gemini Company Briefs</h2>
                <p className="landing-spec-desc">
                  Structured overview, business needs, expansion opportunities,
                  and automated 0–100 qualification fit score.
                </p>
              </div>

              <div className="landing-spec-cell">
                <div className="landing-spec-head">
                  <span className="landing-spec-num mono">03</span>
                  <SlidersIcon size={16} className="landing-spec-icon" />
                </div>
                <h2 className="landing-spec-title">RandomForest Win Prob</h2>
                <p className="landing-spec-desc">
                  5-factor scoring (0–10) mapped through a trained 200-tree
                  classifier for calibrated conversion odds.
                </p>
              </div>

              <div className="landing-spec-cell">
                <div className="landing-spec-head">
                  <span className="landing-spec-num mono">04</span>
                  <MailIcon size={16} className="landing-spec-icon" />
                </div>
                <h2 className="landing-spec-title">Outreach Studio</h2>
                <p className="landing-spec-desc">
                  Multi-tone email generation and follow-up strategy tuned to
                  each prospect’s brief and score.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive 4-Stage Pipeline Walkthrough */}
        <section id="workflow" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-head">
              <div>
                <div className="landing-section-kicker mono">OPERATIONAL WORKFLOW</div>
                <h2 className="landing-section-title">
                  Four deterministic stages from raw account to tailored outreach
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onEnterWorkspace("workbench")}
              >
                <WorkbenchIcon size={15} />
                Open Account Workbench
              </button>
            </div>

            <div className="landing-workflow-grid">
              <div className="landing-stage-list" role="tablist" aria-label="Platform workflow stages">
                {WORKFLOW_STAGES.map((stage) => {
                  const isActive = stage.id === activeStage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`landing-stage-tab ${isActive ? "is-active" : ""}`}
                      onClick={() => setActiveStageId(stage.id)}
                    >
                      <span className="landing-stage-step mono">{stage.step}</span>
                      <span style={{ minWidth: 0 }}>
                        <span className="landing-stage-tab-title">{stage.title}</span>
                        <span className="landing-stage-tab-endpoint mono">
                          {stage.endpoint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="panel landing-stage-detail" role="tabpanel">
                <div className="panel-header">
                  <div>
                    <span className="mono" style={{ fontSize: "11px", color: "var(--accent-ink)", fontWeight: 600 }}>
                      STAGE {activeStage.step} · API CONTRACT
                    </span>
                    <h3 className="panel-title" style={{ marginTop: 2 }}>
                      {activeStage.title}
                    </h3>
                  </div>
                  <code className="tech-tag">{activeStage.endpoint}</code>
                </div>

                <div className="panel-body">
                  <p className="prose-block" style={{ color: "var(--ink-secondary)", marginBottom: 18 }}>
                    {activeStage.summary}
                  </p>

                  <div className="landing-contract-split">
                    <div className="landing-contract-box">
                      <div className="landing-contract-label mono">INPUT SIGNALS</div>
                      <ul className="landing-contract-list">
                        {activeStage.inputs.map((inp) => (
                          <li key={inp}>{inp}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="landing-contract-box">
                      <div className="landing-contract-label mono">PERSISTED OUTPUT</div>
                      <div className="landing-output-rows">
                        {activeStage.outputs.map((out) => (
                          <div key={out.key} className="landing-output-row">
                            <code className="mono" style={{ fontSize: "11.5px", color: "var(--ink-muted)" }}>
                              {out.key}
                            </code>
                            <span
                              className="mono"
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color:
                                  out.accent === "green"
                                    ? "var(--signal-positive)"
                                    : out.accent === "blue"
                                      ? "var(--accent-ink)"
                                      : "var(--ink-primary)",
                              }}
                            >
                              {out.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scoring Engine & Feature Contract */}
        <section id="scoring" className="landing-section landing-section-alt">
          <div className="landing-container">
            <div className="landing-scoring-grid">
              <div className="panel panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ScoringEngineBlueprintSvg />
                <div className="landing-priority-band">
                  <span className="priority-badge priority-high">High ≥ 80</span>
                  <span className="priority-badge priority-medium">Medium 50–79</span>
                  <span className="priority-badge priority-low">Low &lt; 50</span>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="landing-section-kicker mono" style={{ marginBottom: 4 }}>
                      PREDICTIVE CONTRACT
                    </div>
                    <h2 className="panel-title">
                      Transparent 5-factor scoring backed by RandomForest
                    </h2>
                    <p className="panel-subtitle">
                      No black-box magic numbers — inspect every feature dimension and threshold
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEnterWorkspace("model")}
                  >
                    <ModelIcon size={14} />
                    Inspect Model
                  </button>
                </div>

                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Feature Key</th>
                        <th>Scale</th>
                        <th>Evaluated Signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FEATURE_CONTRACT.map((f) => (
                        <tr key={f.key}>
                          <td>
                            <code className="tech-tag">{f.key}</code>
                          </td>
                          <td className="tabular" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                            {f.range}
                          </td>
                          <td style={{ color: "var(--ink-secondary)" }}>{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Architecture & Final Entry CTA */}
        <section id="architecture" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-head">
              <div>
                <div className="landing-section-kicker mono">SYSTEM ARCHITECTURE</div>
                <h2 className="landing-section-title">
                  Built on FastAPI, Gemini AI, scikit-learn, and pure SVG telemetry
                </h2>
              </div>
            </div>

            <div className="landing-arch-grid">
              <div className="panel panel-body">
                <div className="mono" style={{ fontSize: "11px", color: "var(--accent-ink)", fontWeight: 600, marginBottom: 6 }}>
                  LAYER 01 · INTERFACE
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "var(--text-md)" }}>
                  React 19 + TypeScript + SVG
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-secondary)", lineHeight: 1.6 }}>
                  Self-hosted typography, border-defined surfaces, sortable pipeline
                  ledgers, radar charts, and zero third-party chart bloat.
                </p>
              </div>

              <div className="panel panel-body">
                <div className="mono" style={{ fontSize: "11px", color: "var(--accent-ink)", fontWeight: 600, marginBottom: 6 }}>
                  LAYER 02 · INTELLIGENCE
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "var(--text-md)" }}>
                  FastAPI + Gemini Service
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-secondary)", lineHeight: 1.6 }}>
                  Typed Pydantic contracts across leads, company analyses, outreach
                  recommendations, and multi-tone draft generation.
                </p>
              </div>

              <div className="panel panel-body">
                <div className="mono" style={{ fontSize: "11px", color: "var(--signal-positive)", fontWeight: 600, marginBottom: 6 }}>
                  LAYER 03 · ESTIMATOR &amp; DATA
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "var(--text-md)" }}>
                  scikit-learn + SQLAlchemy
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-secondary)", lineHeight: 1.6 }}>
                  Trained <code className="tech-tag">conversion_model.joblib</code>{" "}
                  persisted alongside leads, briefs, scores, and email histories.
                </p>
              </div>
            </div>

            {/* Final Pre-Login Entry Callout */}
            <div className="panel landing-final-cta">
              <div>
                <div className="mono" style={{ fontSize: "11px", color: "var(--accent-ink)", fontWeight: 600, marginBottom: 6 }}>
                  READY TO ENTER WORKSPACE
                </div>
                <h2 className="landing-final-title">
                  Open the SalesGenie AI forecasting console
                </h2>
                <p className="landing-final-sub">
                  Jump directly into the live pipeline or sign in with your operator profile.
                </p>
              </div>

              <div className="landing-final-actions">
                <button
                  type="button"
                  className="btn btn-secondary landing-btn-lg"
                  onClick={() => {
                    setAuthError(null);
                    setAuthModalOpen(true);
                  }}
                >
                  <LockIcon size={15} />
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-primary landing-btn-lg"
                  onClick={() => onEnterWorkspace("forecast")}
                >
                  Launch Workspace
                  <ArrowRightIcon size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Architectural Footer */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BrandEmblem size={24} />
            <span style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>
              SalesGenie AI
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
              · Intelligent Sales Forecasting Platform
            </span>
          </div>

          <div className="landing-footer-links">
            <button type="button" className="landing-footer-link" onClick={() => onEnterWorkspace("forecast")}>
              Forecast &amp; Pipeline
            </button>
            <button type="button" className="landing-footer-link" onClick={() => onEnterWorkspace("directory")}>
              Prospect Directory
            </button>
            <button type="button" className="landing-footer-link" onClick={() => onEnterWorkspace("workbench")}>
              Account Workbench
            </button>
            <button type="button" className="landing-footer-link" onClick={() => onEnterWorkspace("model")}>
              ML Architecture
            </button>
          </div>
        </div>
      </footer>

      {/* Operator Sign-In Modal */}
      {authModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onKeyDown={(e) => {
            if (e.key === "Escape") setAuthModalOpen(false);
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthModalOpen(false);
          }}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="operator-signin-title"
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BrandEmblem size={26} />
                <div>
                  <h2 id="operator-signin-title" className="panel-title">
                    Operator Workspace Access
                  </h2>
                  <p className="panel-subtitle" style={{ fontSize: "var(--text-xs)" }}>
                    Sign in to label your session or continue directly as guest
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Close sign in dialog"
                onClick={() => setAuthModalOpen(false)}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <form className="modal-body" onSubmit={handleSignInSubmit}>
              {authError && (
                <div className="alert-banner alert-error" style={{ marginBottom: 14 }}>
                  {authError}
                </div>
              )}

              <div className="form-field" style={{ marginBottom: 12 }}>
                <label className="form-label" htmlFor="operator-email">
                  Work Email
                </label>
                <input
                  id="operator-email"
                  type="email"
                  className="form-input"
                  placeholder="revops@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-field" style={{ marginBottom: 18 }}>
                <label className="form-label" htmlFor="operator-passcode">
                  Workspace Passcode <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>(optional local session)</span>
                </label>
                <input
                  id="operator-passcode"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  Sign In &amp; Enter Workspace
                  <ArrowRightIcon size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setAuthModalOpen(false);
                    onEnterWorkspace("forecast", null);
                  }}
                >
                  Continue Without Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
