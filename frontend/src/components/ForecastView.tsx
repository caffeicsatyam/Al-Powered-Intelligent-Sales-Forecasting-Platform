import { useMemo, useState } from "react";
import {
  LEAD_STATUSES,
  type Lead,
  type LeadIntelligenceBundle,
} from "../types/sales";
import {
  AnalysisPulseIcon,
  EmptySignalIllustration,
  PlusIcon,
} from "./Icons";
import { PipelineForecastChart } from "./PipelineForecastChart";

interface ForecastViewProps {
  leads: Lead[];
  intelligence: Record<number, LeadIntelligenceBundle>;
  loading: boolean;
  seedingSamples: boolean;
  analyzingLeadIds: Record<number, boolean>;
  onOpenLead: (leadId: number) => void;
  onUpdateStage: (leadId: number, status: string) => Promise<void>;
  onRunQuickAnalysis: (leadId: number) => Promise<void>;
  onOpenCreateDrawer: () => void;
  onSeedSamples: () => Promise<void>;
}

type SortKey = "company" | "stage" | "analysis" | "score" | "probability";

function stageClass(status: string): string {
  return `stage-badge stage-${status.toLowerCase()}`;
}

function priorityClass(priority: string): string {
  const norm = priority.toLowerCase();
  if (norm === "high") return "priority-badge priority-high";
  if (norm === "medium") return "priority-badge priority-medium";
  return "priority-badge priority-low";
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ForecastView({
  leads,
  intelligence,
  loading,
  seedingSamples,
  analyzingLeadIds,
  onOpenLead,
  onUpdateStage,
  onRunQuickAnalysis,
  onOpenCreateDrawer,
  onSeedSamples,
}: ForecastViewProps) {
  const [stageFilter, setStageFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("probability");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const stats = useMemo(() => {
    const activeLeads = leads.filter((l) => l.status !== "Lost");
    const scored = leads.filter(
      (l) => typeof intelligence[l.id]?.score?.conversation_probability === "number"
    );
    const analyzed = leads.filter((l) => Boolean(intelligence[l.id]?.analysis));
    const highPriority = leads.filter(
      (l) => (intelligence[l.id]?.score?.total_score ?? 0) >= 80
    );
    const meanProb =
      scored.length > 0
        ? scored.reduce(
            (sum, l) =>
              sum + (intelligence[l.id]?.score?.conversation_probability ?? 0),
            0
          ) / scored.length
        : null;
    const meanScore =
      scored.length > 0
        ? scored.reduce(
            (sum, l) => sum + (intelligence[l.id]?.score?.total_score ?? 0),
            0
          ) / scored.length
        : null;
    const wonCount = leads.filter((l) => l.status === "Won").length;
    const unscoredCount = leads.length - scored.length;

    return {
      total: leads.length,
      activeCount: activeLeads.length,
      scoredCount: scored.length,
      analyzedCount: analyzed.length,
      highPriorityCount: highPriority.length,
      meanProb,
      meanScore,
      wonCount,
      unscoredCount,
    };
  }, [leads, intelligence]);

  const filteredLeads = useMemo(() => {
    const base =
      stageFilter === "All"
        ? leads
        : leads.filter((l) => l.status === stageFilter);

    return [...base].sort((a, b) => {
      const ia = intelligence[a.id];
      const ib = intelligence[b.id];
      let cmp = 0;

      if (sortKey === "company") {
        cmp = a.company_name.localeCompare(b.company_name);
      } else if (sortKey === "stage") {
        cmp = a.status.localeCompare(b.status);
      } else if (sortKey === "analysis") {
        cmp =
          (ia?.analysis?.qualification_score ?? -1) -
          (ib?.analysis?.qualification_score ?? -1);
      } else if (sortKey === "score") {
        cmp = (ia?.score?.total_score ?? -1) - (ib?.score?.total_score ?? -1);
      } else {
        cmp =
          (ia?.score?.conversation_probability ?? -1) -
          (ib?.score?.conversation_probability ?? -1);
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [leads, intelligence, stageFilter, sortKey, sortDir]);

  const toggleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir(nextKey === "company" || nextKey === "stage" ? "asc" : "desc");
    }
  };

  if (loading) {
    return (
      <div>
        <div className="forecast-hero-grid">
          <div className="panel panel-body">
            <div className="skeleton" style={{ height: 22, width: "42%", marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 220, width: "100%" }} />
          </div>
          <div className="panel panel-body">
            <div className="skeleton" style={{ height: 22, width: "55%", marginBottom: 18 }} />
            <div className="skeleton" style={{ height: 48, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 48, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 48 }} />
          </div>
        </div>
        <div className="panel panel-body">
          <div className="skeleton" style={{ height: 220, width: "100%" }} />
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="panel">
        <div className="empty-state">
          <EmptySignalIllustration />
          <h2 className="empty-state-title">No prospects in pipeline yet</h2>
          <p className="empty-state-desc">
            Add your first B2B account or load a representative 6-account sample
            pipeline to unlock AI company briefings, RandomForest conversion
            probabilities, and tailored outreach drafts.
          </p>
          <div className="empty-state-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenCreateDrawer}
            >
              <PlusIcon size={16} />
              Add first prospect
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={seedingSamples}
              onClick={() => void onSeedSamples()}
            >
              {seedingSamples ? "Adding sample accounts..." : "Load 6 sample B2B accounts"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Analytical Strip: SVG Calibration Plot + Weighted Forecast Ledger */}
      <div className="forecast-hero-grid">
        <section className="panel" aria-label="Pipeline trajectory and probability matrix">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Pipeline Trajectory &amp; Conversion Calibration</h2>
              <p className="panel-subtitle">
                Live stage funnel alongside RandomForest conversion probability vs. weighted lead score
              </p>
            </div>
            {stageFilter !== "All" && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setStageFilter("All")}
              >
                Clear stage: {stageFilter}
              </button>
            )}
          </div>
          <div className="panel-body">
            <PipelineForecastChart
              leads={leads}
              intelligence={intelligence}
              activeStageFilter={stageFilter}
              onSelectStage={setStageFilter}
              onOpenLead={onOpenLead}
            />
          </div>
        </section>

        <aside className="panel" aria-label="Forecast readiness ledger">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Forecast Ledger</h2>
              <p className="panel-subtitle">Real-time database &amp; ML model coverage</p>
            </div>
          </div>
          <div className="ledger-rows">
            <div className="ledger-row">
              <div>
                <div className="ledger-row-label">Active pipeline accounts</div>
                <div className="ledger-row-sub">
                  {stats.total} total · {stats.wonCount} closed won
                </div>
              </div>
              <div className="ledger-row-value">{stats.activeCount}</div>
            </div>

            <div className="ledger-row">
              <div>
                <div className="ledger-row-label">Mean ML conversion probability</div>
                <div className="ledger-row-sub">
                  {stats.scoredCount} of {stats.total} scored via scikit-learn RF
                </div>
              </div>
              <div className="ledger-row-value is-accent">
                {stats.meanProb !== null ? `${stats.meanProb.toFixed(1)}%` : "—"}
              </div>
            </div>

            <div className="ledger-row">
              <div>
                <div className="ledger-row-label">High-priority queue (≥ 80)</div>
                <div className="ledger-row-sub">
                  Mean heuristic score:{" "}
                  {stats.meanScore !== null ? `${stats.meanScore.toFixed(0)}/100` : "—"}
                </div>
              </div>
              <div className="ledger-row-value is-positive">
                {stats.highPriorityCount}
              </div>
            </div>

            <div className="ledger-row">
              <div>
                <div className="ledger-row-label">AI company intelligence coverage</div>
                <div className="ledger-row-sub">
                  {stats.unscoredCount > 0
                    ? `${stats.unscoredCount} accounts awaiting ML scoring`
                    : "All pipeline accounts scored"}
                </div>
              </div>
              <div className="ledger-row-value">
                {stats.analyzedCount}/{stats.total}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Interactive Account Readiness Table */}
      <section className="panel" aria-label="Pipeline readiness matrix">
        <div className="table-toolbar">
          <div className="filter-pills" role="group" aria-label="Filter by pipeline stage">
            {["All", ...LEAD_STATUSES].map((stage) => {
              const count =
                stage === "All"
                  ? leads.length
                  : leads.filter((l) => l.status === stage).length;
              return (
                <button
                  key={stage}
                  type="button"
                  className={`filter-pill ${stageFilter === stage ? "is-active" : ""}`}
                  onClick={() => setStageFilter(stage)}
                >
                  {stage} <span className="tabular">({count})</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="tabular" style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
              Showing {filteredLeads.length} of {leads.length}
            </span>
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="is-sortable" onClick={() => toggleSort("company")}>
                  Account {sortKey === "company" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th>Industry &amp; Contact</th>
                <th className="is-sortable" onClick={() => toggleSort("stage")}>
                  Stage {sortKey === "stage" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="is-sortable" onClick={() => toggleSort("analysis")}>
                  AI Intel {sortKey === "analysis" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="is-sortable" onClick={() => toggleSort("score")}>
                  Lead Score {sortKey === "score" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="is-sortable" onClick={() => toggleSort("probability")}>
                  ML Conv. Prob. {sortKey === "probability" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const intel = intelligence[lead.id];
                const analysis = intel?.analysis ?? null;
                const score = intel?.score ?? null;
                const isAnalyzing = Boolean(analyzingLeadIds[lead.id]);
                const prob = score?.conversation_probability;
                const probColor =
                  typeof prob === "number"
                    ? prob >= 70
                      ? "var(--signal-positive)"
                      : prob >= 45
                        ? "var(--accent)"
                        : "var(--signal-caution)"
                    : "var(--border-strong)";

                return (
                  <tr key={lead.id}>
                    <td>
                      <button
                        type="button"
                        className="company-cell-btn"
                        onClick={() => onOpenLead(lead.id)}
                      >
                        <span className="company-monogram">
                          {getInitials(lead.company_name)}
                        </span>
                        <span>
                          <span className="company-cell-name" style={{ display: "block" }}>
                            {lead.company_name}
                          </span>
                          <span className="company-cell-sub">
                            {lead.location || "Location unrecorded"}
                            {lead.employee_count ? ` · ${lead.employee_count} staff` : ""}
                          </span>
                        </span>
                      </button>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500, color: "var(--ink-primary)" }}>
                        {lead.industry}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                        {lead.contact_person || lead.email || "No contact recorded"}
                      </div>
                    </td>

                    <td>
                      <select
                        aria-label={`Pipeline stage for ${lead.company_name}`}
                        className="stage-select"
                        value={lead.status}
                        onChange={(e) => void onUpdateStage(lead.id, e.target.value)}
                      >
                        {LEAD_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <div style={{ marginTop: 4 }}>
                        <span className={stageClass(lead.status)}>{lead.status}</span>
                      </div>
                    </td>

                    <td>
                      {isAnalyzing ? (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--accent-ink)", fontWeight: 600 }}>
                          Running AI brief...
                        </span>
                      ) : analysis ? (
                        <div>
                          <span className="tabular" style={{ fontWeight: 700, color: "var(--ink-primary)" }}>
                            {analysis.qualification_score}/100
                          </span>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                            Brief saved
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => void onRunQuickAnalysis(lead.id).catch(() => {})}
                        >
                          <AnalysisPulseIcon size={13} />
                          Analyze
                        </button>
                      )}
                    </td>

                    <td>
                      {score ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="tabular" style={{ fontWeight: 700 }}>
                            {score.total_score}
                          </span>
                          <span className={priorityClass(score.priority)}>
                            {score.priority}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                          Not scored
                        </span>
                      )}
                    </td>

                    <td>
                      {typeof prob === "number" ? (
                        <div className="prob-meter">
                          <div className="prob-bar-track">
                            <div
                              className="prob-bar-fill"
                              style={{
                                width: `${Math.max(4, Math.min(100, prob))}%`,
                                backgroundColor: probColor,
                              }}
                            />
                          </div>
                          <span className="tabular" style={{ fontWeight: 700, minWidth: 44, textAlign: "right" }}>
                            {prob.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                          Awaiting 5-factor input
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onOpenLead(lead.id)}
                      >
                        Open workbench
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--ink-secondary)" }}>
                    No prospects in the <strong>{stageFilter}</strong> stage.{" "}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setStageFilter("All")}
                    >
                      Show all stages
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
