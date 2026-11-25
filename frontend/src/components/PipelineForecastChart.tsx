import { useState } from "react";
import {
  LEAD_STATUSES,
  type Lead,
  type LeadIntelligenceBundle,
} from "../types/sales";

interface PipelineForecastChartProps {
  leads: Lead[];
  intelligence: Record<number, LeadIntelligenceBundle>;
  activeStageFilter: string;
  onSelectStage: (stage: string) => void;
  onOpenLead: (leadId: number) => void;
}

const STAGE_COLOR: Record<string, string> = {
  New: "#616E7C",
  Contacted: "#1849A9",
  Qualified: "#1B4DFF",
  Proposal: "#B45309",
  Won: "#0E7454",
  Lost: "#B42318",
};

export function PipelineForecastChart({
  leads,
  intelligence,
  activeStageFilter,
  onSelectStage,
  onOpenLead,
}: PipelineForecastChartProps) {
  const [hoveredLeadId, setHoveredLeadId] = useState<number | null>(null);

  const stageRows = LEAD_STATUSES.map((stage) => {
    const group = leads.filter((l) => l.status === stage);
    const probs = group
      .map((l) => intelligence[l.id]?.score?.conversation_probability)
      .filter((v): v is number => typeof v === "number");
    const avgProb =
      probs.length > 0
        ? probs.reduce((acc, v) => acc + v, 0) / probs.length
        : null;
    return {
      stage,
      count: group.length,
      avgProb,
      color: STAGE_COLOR[stage] ?? "#475467",
    };
  });

  const maxStageCount = Math.max(1, ...stageRows.map((r) => r.count));

  // Build points for the Calibration Matrix (X = heuristic total_score or qualification_score, Y = ML conversion probability)
  const plottedPoints = leads
    .map((lead) => {
      const intel = intelligence[lead.id];
      const score = intel?.score;
      const analysis = intel?.analysis;
      if (!score && !analysis) return null;
      const xScore = score?.total_score ?? analysis?.qualification_score ?? 0;
      const yProb =
        score?.conversation_probability ??
        Math.round((analysis?.qualification_score ?? 50) * 0.72);
      const isMlBacked = typeof score?.conversation_probability === "number";
      return {
        lead,
        xScore,
        yProb,
        isMlBacked,
        color: STAGE_COLOR[lead.status] ?? "#475467",
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const hoveredPoint =
    plottedPoints.find((p) => p.lead.id === hoveredLeadId) ?? null;

  const plotLeft = 48;
  const plotRight = 540;
  const plotTop = 20;
  const plotBottom = 186;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const mapX = (val: number) =>
    plotLeft + (Math.max(0, Math.min(100, val)) / 100) * plotW;
  const mapY = (val: number) =>
    plotBottom - (Math.max(0, Math.min(100, val)) / 100) * plotH;

  return (
    <div className="forecast-chart-layout">
      {/* Left: Stage Distribution Funnel Bars */}
      <div className="forecast-stage-col">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--ink-muted)",
          }}
        >
          <span>Stage distribution</span>
          <span>Click to filter</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stageRows.map((row) => {
            const isSelected = activeStageFilter === row.stage;
            const barWidth = Math.max(
              row.count > 0 ? 12 : 0,
              Math.round((row.count / maxStageCount) * 100)
            );
            return (
              <button
                key={row.stage}
                type="button"
                onClick={() =>
                  onSelectStage(isSelected ? "All" : row.stage)
                }
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: isSelected
                    ? "1px solid var(--accent)"
                    : "1px solid transparent",
                  background: isSelected
                    ? "var(--accent-tint)"
                    : "transparent",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--ink-primary)" }}>
                    {row.stage}
                  </span>
                  <span className="tabular" style={{ color: "var(--ink-secondary)" }}>
                    {row.count}
                    {row.avgProb !== null ? ` · ${row.avgProb.toFixed(0)}%` : ""}
                  </span>
                </div>
                <svg width="100%" height="6" viewBox="0 0 100 6" preserveAspectRatio="none">
                  <rect
                    x="0"
                    y="0"
                    width="100"
                    height="6"
                    rx="3"
                    fill="#E8EAE4"
                  />
                  {barWidth > 0 && (
                    <rect
                      x="0"
                      y="0"
                      width={barWidth}
                      height="6"
                      rx="3"
                      fill={row.color}
                    />
                  )}
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: SVG Probability Calibration & Deal Matrix */}
      <div style={{ position: "relative", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
            fontSize: "var(--text-xs)",
            color: "var(--ink-muted)",
          }}
        >
          <span>Score vs. RandomForest conversion probability</span>
          <span style={{ display: "inline-flex", gap: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="4" fill="#1B4DFF" />
              </svg>
              ML scored
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="3.5" fill="#FFFFFF" stroke="#616E7C" strokeWidth="1.5" />
              </svg>
              AI intel only
            </span>
          </span>
        </div>

        <svg
          width="100%"
          viewBox="0 0 564 218"
          role="img"
          aria-label="Scatter plot comparing lead heuristic qualification score against RandomForest conversion probability"
          style={{ display: "block", overflow: "visible" }}
        >
          {/* High-priority quadrant wash */}
          <rect
            x={mapX(80)}
            y={mapY(100)}
            width={mapX(100) - mapX(80)}
            height={mapY(70) - mapY(100)}
            fill="#EAF7F1"
            opacity="0.65"
          />

          {/* Gridlines */}
          {[0, 25, 50, 75, 100].map((val) => (
            <g key={`y-${val}`}>
              <line
                x1={plotLeft}
                y1={mapY(val)}
                x2={plotRight}
                y2={mapY(val)}
                stroke={val === 50 ? "#C6CAC0" : "#ECEEE9"}
                strokeDasharray={val === 50 ? "3 3" : undefined}
                strokeWidth="1"
              />
              <text
                x={plotLeft - 8}
                y={mapY(val) + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#5F6C7B"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {val}%
              </text>
            </g>
          ))}

          {[0, 25, 50, 80, 100].map((val) => (
            <g key={`x-${val}`}>
              <line
                x1={mapX(val)}
                y1={plotTop}
                x2={mapX(val)}
                y2={plotBottom}
                stroke={val === 80 ? "#B5E3CF" : "#ECEEE9"}
                strokeDasharray={val === 80 ? "4 3" : undefined}
                strokeWidth="1"
              />
              <text
                x={mapX(val)}
                y={plotBottom + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#5F6C7B"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {val}
              </text>
            </g>
          ))}

          {/* Axis Baseline */}
          <line
            x1={plotLeft}
            y1={plotBottom}
            x2={plotRight}
            y2={plotBottom}
            stroke="#C6CAC0"
            strokeWidth="1.2"
          />
          <line
            x1={plotLeft}
            y1={plotTop}
            x2={plotLeft}
            y2={plotBottom}
            stroke="#C6CAC0"
            strokeWidth="1.2"
          />

          <text
            x={mapX(90)}
            y={plotTop + 13}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="600"
            fill="#0E7454"
          >
            Priority zone
          </text>

          <text
            x={(plotLeft + plotRight) / 2}
            y={214}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="600"
            fill="#5F6C7B"
          >
            Weighted Lead Score (0–100)
          </text>

          {/* Plotted prospect nodes */}
          {plottedPoints.map((pt) => {
            const cx = mapX(pt.xScore);
            const cy = mapY(pt.yProb);
            const isHovered = hoveredLeadId === pt.lead.id;
            return (
              <g
                key={pt.lead.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredLeadId(pt.lead.id)}
                onMouseLeave={() => setHoveredLeadId(null)}
                onClick={() => onOpenLead(pt.lead.id)}
              >
                {isHovered && (
                  <>
                    <line
                      x1={cx}
                      y1={plotTop}
                      x2={cx}
                      y2={plotBottom}
                      stroke="#1B4DFF"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                    <line
                      x1={plotLeft}
                      y1={cy}
                      x2={plotRight}
                      y2={cy}
                      stroke="#1B4DFF"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                  </>
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8.5 : 6.5}
                  fill={pt.isMlBacked ? pt.color : "#FFFFFF"}
                  stroke={pt.isMlBacked ? "#FFFFFF" : pt.color}
                  strokeWidth={pt.isMlBacked ? 2 : 2.2}
                />
              </g>
            );
          })}

          {plottedPoints.length === 0 && (
            <text
              x={(plotLeft + plotRight) / 2}
              y={(plotTop + plotBottom) / 2}
              textAnchor="middle"
              fontSize="12"
              fill="#5F6C7B"
            >
              Score or analyze any lead below to plot its forecast position
            </text>
          )}
        </svg>

        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              right: 8,
              top: 28,
              background: "#111820",
              color: "#FFFFFF",
              padding: "8px 11px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-xs)",
              pointerEvents: "none",
              boxShadow: "var(--shadow-popover)",
              maxWidth: 230,
            }}
          >
            <div style={{ fontWeight: 700 }}>{hoveredPoint.lead.company_name}</div>
            <div style={{ color: "#CBD5E1", marginTop: 2 }}>
              Stage: {hoveredPoint.lead.status}
            </div>
            <div className="tabular" style={{ marginTop: 4 }}>
              Score: {hoveredPoint.xScore}/100 ·{" "}
              {hoveredPoint.isMlBacked
                ? `ML Prob: ${hoveredPoint.yProb.toFixed(1)}%`
                : `Intel Est: ${hoveredPoint.yProb}%`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
