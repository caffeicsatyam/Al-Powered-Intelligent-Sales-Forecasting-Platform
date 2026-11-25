import type { ScoreRequest } from "../types/sales";

interface FactorRadarChartProps {
  draft: ScoreRequest;
  baseline?: ScoreRequest | null;
}

const AXES: Array<{ key: keyof ScoreRequest; label: string }> = [
  { key: "company_growth", label: "Growth" },
  { key: "industry_match", label: "Industry Fit" },
  { key: "technology_alignment", label: "Tech Align" },
  { key: "business_need", label: "Need" },
  { key: "engagement_level", label: "Engagement" },
];

export function FactorRadarChart({ draft, baseline }: FactorRadarChartProps) {
  const cx = 160;
  const cy = 148;
  const maxR = 96;
  const levels = [2, 4, 6, 8, 10];

  const vertexPoint = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
    const r = (Math.max(0, Math.min(10, value)) / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const toPolygonPoints = (values: ScoreRequest) =>
    AXES.map((axis, idx) => {
      const pt = vertexPoint(idx, values[axis.key]);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(" ");

  return (
    <svg
      width="100%"
      viewBox="0 0 320 296"
      role="img"
      aria-label="Five-factor lead scoring footprint comparison"
      style={{ maxWidth: 340, display: "block", margin: "0 auto" }}
    >
      {/* Concentric pentagon grid rings */}
      {levels.map((level) => {
        const pts = AXES.map((_, idx) => {
          const pt = vertexPoint(idx, level);
          return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill={level === 10 ? "#FAF9F6" : "none"}
            stroke="#E1E3DD"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis spokes & labels */}
      {AXES.map((axis, idx) => {
        const edge = vertexPoint(idx, 10);
        const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / AXES.length;
        const labelR = maxR + 22;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        const anchor =
          Math.abs(Math.cos(angle)) < 0.25
            ? "middle"
            : Math.cos(angle) > 0
              ? "start"
              : "end";

        return (
          <g key={axis.key}>
            <line
              x1={cx}
              y1={cy}
              x2={edge.x}
              y2={edge.y}
              stroke="#E1E3DD"
              strokeWidth="1"
            />
            <text
              x={lx}
              y={ly + 4}
              textAnchor={anchor}
              fontSize="11"
              fontWeight="600"
              fill="#475467"
            >
              {axis.label}
            </text>
          </g>
        );
      })}

      {/* Scale annotations along top spoke */}
      {[4, 8, 10].map((tick) => {
        const pt = vertexPoint(0, tick);
        return (
          <text
            key={tick}
            x={pt.x + 5}
            y={pt.y + 3}
            fontSize="9"
            fontWeight="600"
            fill="#8D96A0"
          >
            {tick}
          </text>
        );
      })}

      {/* Persisted baseline polygon if present */}
      {baseline && (
        <polygon
          points={toPolygonPoints(baseline)}
          fill="rgba(71, 84, 103, 0.08)"
          stroke="#616E7C"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}

      {/* Active draft polygon */}
      <polygon
        points={toPolygonPoints(draft)}
        fill="rgba(27, 77, 255, 0.14)"
        stroke="#1B4DFF"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Interactive vertex dots */}
      {AXES.map((axis, idx) => {
        const pt = vertexPoint(idx, draft[axis.key]);
        return (
          <g key={axis.key}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4.2"
              fill="#FFFFFF"
              stroke="#1B4DFF"
              strokeWidth="2.2"
            />
          </g>
        );
      })}
    </svg>
  );
}
