export function ConfusionMatrixSvg() {
  return (
    <svg
      width="100%"
      viewBox="0 0 340 210"
      role="img"
      aria-label="Random Forest test split confusion matrix: 2 true negatives, 0 false positives, 0 false negatives, 2 true positives"
      style={{ maxWidth: 340, display: "block" }}
    >
      <text
        x="205"
        y="18"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#475467"
      >
        Predicted Class
      </text>
      <text
        x="150"
        y="36"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="600"
        fill="#5F6C7B"
      >
        Not Converted (0)
      </text>
      <text
        x="262"
        y="36"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="600"
        fill="#5F6C7B"
      >
        Converted (1)
      </text>

      <text
        x="52"
        y="84"
        textAnchor="end"
        fontSize="10.5"
        fontWeight="600"
        fill="#5F6C7B"
      >
        Actual 0
      </text>
      <text
        x="52"
        y="162"
        textAnchor="end"
        fontSize="10.5"
        fontWeight="600"
        fill="#5F6C7B"
      >
        Actual 1
      </text>

      {/* TN */}
      <rect
        x="96"
        y="48"
        width="106"
        height="70"
        rx="6"
        fill="#EAF7F1"
        stroke="#B5E3CF"
        strokeWidth="1.2"
      />
      <text
        x="149"
        y="83"
        textAnchor="middle"
        fontSize="24"
        fontWeight="700"
        fill="#0E7454"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        2
      </text>
      <text x="149" y="102" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0E7454">
        True Negative
      </text>

      {/* FP */}
      <rect
        x="210"
        y="48"
        width="106"
        height="70"
        rx="6"
        fill="#FAF9F6"
        stroke="#E1E3DD"
        strokeWidth="1.2"
      />
      <text
        x="263"
        y="83"
        textAnchor="middle"
        fontSize="24"
        fontWeight="700"
        fill="#5F6C7B"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        0
      </text>
      <text x="263" y="102" textAnchor="middle" fontSize="10" fontWeight="600" fill="#5F6C7B">
        False Positive
      </text>

      {/* FN */}
      <rect
        x="96"
        y="126"
        width="106"
        height="70"
        rx="6"
        fill="#FAF9F6"
        stroke="#E1E3DD"
        strokeWidth="1.2"
      />
      <text
        x="149"
        y="161"
        textAnchor="middle"
        fontSize="24"
        fontWeight="700"
        fill="#5F6C7B"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        0
      </text>
      <text x="149" y="180" textAnchor="middle" fontSize="10" fontWeight="600" fill="#5F6C7B">
        False Negative
      </text>

      {/* TP */}
      <rect
        x="210"
        y="126"
        width="106"
        height="70"
        rx="6"
        fill="#EEF3FF"
        stroke="#C4D5FD"
        strokeWidth="1.2"
      />
      <text
        x="263"
        y="161"
        textAnchor="middle"
        fontSize="24"
        fontWeight="700"
        fill="#1032AD"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        2
      </text>
      <text x="263" y="180" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1032AD">
        True Positive
      </text>
    </svg>
  );
}
