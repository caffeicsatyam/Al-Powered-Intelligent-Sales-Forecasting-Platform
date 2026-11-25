interface QualificationArcGaugeProps {
  score: number;
  label?: string;
}

export function QualificationArcGauge({
  score,
  label = "Qualification",
}: QualificationArcGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const cx = 110;
  const cy = 96;
  const radius = 78;
  const startAngle = Math.PI;
  const endAngle = 0;
  const currentAngle = Math.PI - (clamped / 100) * Math.PI;

  const arcPoint = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  });

  const trackStart = arcPoint(startAngle, radius);
  const trackEnd = arcPoint(endAngle, radius);
  const valueEnd = arcPoint(currentAngle, radius);
  const largeArc = clamped > 100 ? 1 : 0;

  const toneColor =
    clamped >= 75
      ? "#0E7454"
      : clamped >= 50
        ? "#1B4DFF"
        : clamped >= 35
          ? "#9F5205"
          : "#B42318";

  const bandLabel =
    clamped >= 75
      ? "Strong fit"
      : clamped >= 50
        ? "Qualified prospect"
        : "Needs discovery";

  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        width="220"
        height="132"
        viewBox="0 0 220 132"
        role="img"
        aria-label={`${label} score ${clamped} out of 100 (${bandLabel})`}
      >
        {/* Outer calibrated ticks */}
        {ticks.map((tick) => {
          const angle = Math.PI - (tick / 100) * Math.PI;
          const p1 = arcPoint(angle, radius + 7);
          const p2 = arcPoint(angle, radius + 12);
          const lbl = arcPoint(angle, radius + 21);
          return (
            <g key={tick}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#C6CAC0"
                strokeWidth="1.4"
              />
              <text
                x={lbl.x}
                y={lbl.y + 3}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill="#5F6C7B"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Track Arc */}
        <path
          d={`M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none"
          stroke="#E8EAE4"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Value Arc */}
        {clamped > 0 && (
          <path
            d={`M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${valueEnd.x} ${valueEnd.y}`}
            fill="none"
            stroke={toneColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}

        {/* Needle indicator dot */}
        <circle
          cx={valueEnd.x}
          cy={valueEnd.y}
          r="5"
          fill="#FFFFFF"
          stroke={toneColor}
          strokeWidth="2.5"
        />

        <text
          x={cx}
          y={cy - 16}
          textAnchor="middle"
          fontSize="30"
          fontWeight="700"
          fill="#111820"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {clamped}
        </text>
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#5F6C7B"
        >
          of 100 · {bandLabel}
        </text>
      </svg>
    </div>
  );
}
