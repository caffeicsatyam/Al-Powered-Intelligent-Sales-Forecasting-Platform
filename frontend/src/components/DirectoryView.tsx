import { useMemo, useState } from "react";
import {
  LEAD_STATUSES,
  type Lead,
  type LeadIntelligenceBundle,
} from "../types/sales";
import {
  DownloadIcon,
  EditIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "./Icons";

interface DirectoryViewProps {
  leads: Lead[];
  intelligence: Record<number, LeadIntelligenceBundle>;
  onOpenLead: (leadId: number) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => Promise<void>;
  onOpenCreateDrawer: () => void;
}

function escapeCsv(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function DirectoryView({
  leads,
  intelligence,
  onOpenLead,
  onEditLead,
  onDeleteLead,
  onOpenCreateDrawer,
}: DirectoryViewProps) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All");
  const [industry, setIndustry] = useState("All");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const industries = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.industry.trim()) set.add(l.industry.trim());
    });
    return ["All", ...Array.from(set).sort()];
  }, [leads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (stage !== "All" && lead.status !== stage) return false;
      if (industry !== "All" && lead.industry !== industry) return false;
      if (!q) return true;
      return (
        lead.company_name.toLowerCase().includes(q) ||
        lead.industry.toLowerCase().includes(q) ||
        (lead.contact_person ?? "").toLowerCase().includes(q) ||
        (lead.location ?? "").toLowerCase().includes(q) ||
        (lead.technology_stack ?? "").toLowerCase().includes(q)
      );
    });
  }, [leads, query, stage, industry]);

  const exportCsv = () => {
    const headers = [
      "ID",
      "Company",
      "Industry",
      "Stage",
      "Contact",
      "Email",
      "Location",
      "Employees",
      "AI Qualification",
      "Lead Score",
      "Priority",
      "ML Conversion Prob %",
    ];
    const rows = filtered.map((lead) => {
      const intel = intelligence[lead.id];
      return [
        lead.id,
        lead.company_name,
        lead.industry,
        lead.status,
        lead.contact_person,
        lead.email,
        lead.location,
        lead.employee_count,
        intel?.analysis?.qualification_score ?? "",
        intel?.score?.total_score ?? "",
        intel?.score?.priority ?? "",
        intel?.score?.conversation_probability ?? "",
      ]
        .map(escapeCsv)
        .join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `salesgenie-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel" aria-label="Prospect directory">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Prospect Directory</h2>
          <p className="panel-subtitle">
            Search, segment, update, or export your full B2B account database
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            <DownloadIcon size={15} />
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreateDrawer}
          >
            <PlusIcon size={15} />
            New prospect
          </button>
        </div>
      </div>

      <div
        className="table-toolbar"
        style={{ borderRadius: 0, backgroundColor: "var(--bg-surface)" }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 270 }}>
            <SearchIcon
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="search"
              className="form-input"
              style={{ paddingLeft: 32, height: 34 }}
              placeholder="Filter company, contact, tech stack..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            aria-label="Filter by industry"
            className="form-select"
            style={{ width: 200, height: 34, padding: "0 10px" }}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind === "All" ? "All industries" : ind}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-pills">
          {["All", ...LEAD_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              className={`filter-pill ${stage === st ? "is-active" : ""}`}
              onClick={() => setStage(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Contact &amp; Channels</th>
              <th>Technology Stack</th>
              <th>Stage</th>
              <th>Updated</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => {
              const stackItems = (lead.technology_stack ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 3);
              return (
                <tr key={lead.id}>
                  <td className="mono tabular" style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                    #{lead.id}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="company-cell-btn"
                      onClick={() => onOpenLead(lead.id)}
                    >
                      <span>
                        <span className="company-cell-name" style={{ display: "block" }}>
                          {lead.company_name}
                        </span>
                        <span className="company-cell-sub">
                          {lead.industry}
                          {lead.location ? ` · ${lead.location}` : ""}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {lead.contact_person || "Unassigned contact"}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                      {lead.email || lead.phone || "No email or phone"}
                    </div>
                  </td>
                  <td>
                    {stackItems.length > 0 ? (
                      <div className="tech-tags">
                        {stackItems.map((tag) => (
                          <span key={tag} className="tech-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                        Not specified
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`stage-badge stage-${lead.status.toLowerCase()}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="tabular" style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                    {new Date(lead.updated_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onOpenLead(lead.id)}
                      >
                        Workbench
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label={`Edit ${lead.company_name}`}
                        onClick={() => onEditLead(lead)}
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label={`Delete ${lead.company_name}`}
                        disabled={deletingId === lead.id}
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Delete ${lead.company_name} from the database?`
                            )
                          ) {
                            return;
                          }
                          setDeletingId(lead.id);
                          try {
                            await onDeleteLead(lead);
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "var(--ink-secondary)" }}>
                  No accounts match your current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
