import { useEffect, useState, type FormEvent } from "react";
import { SAMPLE_PROSPECTS } from "../data/sampleProspects";
import { LEAD_STATUSES, type Lead, type LeadCreatePayload } from "../types/sales";
import { AlertIcon, CloseIcon } from "./Icons";

interface LeadFormDrawerProps {
  open: boolean;
  editingLead: Lead | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: LeadCreatePayload, editingLeadId?: number) => Promise<void>;
}

const EMPTY_FORM: LeadCreatePayload = {
  company_name: "",
  industry: "",
  contact_person: "",
  email: "",
  phone: "",
  website: "",
  employee_count: "",
  location: "",
  technology_stack: "",
  description: "",
  status: "New",
};

export function LeadFormDrawer({
  open,
  editingLead,
  saving,
  error,
  onClose,
  onSubmit,
}: LeadFormDrawerProps) {
  const [form, setForm] = useState<LeadCreatePayload>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValidationError(null);
    if (editingLead) {
      setForm({
        company_name: editingLead.company_name,
        industry: editingLead.industry,
        contact_person: editingLead.contact_person ?? "",
        email: editingLead.email ?? "",
        phone: editingLead.phone ?? "",
        website: editingLead.website ?? "",
        employee_count: editingLead.employee_count ?? "",
        location: editingLead.location ?? "",
        technology_stack: editingLead.technology_stack ?? "",
        description: editingLead.description ?? "",
        status: editingLead.status || "New",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editingLead]);

  if (!open) return null;

  const setField = <K extends keyof LeadCreatePayload>(
    key: K,
    value: LeadCreatePayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applySamplePreset = () => {
    const sample =
      SAMPLE_PROSPECTS[Math.floor(Math.random() * SAMPLE_PROSPECTS.length)];
    setForm({ ...sample });
    setValidationError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.company_name.trim() || !form.industry.trim()) {
      setValidationError("Company name and industry are required.");
      return;
    }
    const emailTrimmed = (form.email ?? "").trim();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setValidationError("Enter a valid email address or leave it blank.");
      return;
    }

    setValidationError(null);
    const cleaned: LeadCreatePayload = {
      company_name: form.company_name.trim(),
      industry: form.industry.trim(),
      contact_person: form.contact_person?.trim() || null,
      email: emailTrimmed || null,
      phone: form.phone?.trim() || null,
      website: form.website?.trim() || null,
      employee_count: form.employee_count?.trim() || null,
      location: form.location?.trim() || null,
      technology_stack: form.technology_stack?.trim() || null,
      description: form.description?.trim() || null,
      status: form.status || "New",
    };

    await onSubmit(cleaned, editingLead?.id);
  };

  const shownError = validationError || error;

  return (
    <div
      className="drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="drawer-panel">
        <div className="drawer-header">
          <div>
            <h2 id="lead-drawer-title" className="panel-title">
              {editingLead
                ? `Edit ${editingLead.company_name}`
                : "New B2B Prospect"}
            </h2>
            <p className="panel-subtitle">
              {editingLead
                ? "Update account intelligence attributes and pipeline stage."
                : "Add an account to run AI qualification, scoring, and outreach."}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={saving}
            aria-label="Close prospect form"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form id="lead-drawer-form" className="drawer-body" onSubmit={handleSubmit}>
          {!editingLead && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                marginBottom: 16,
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface-subtle)",
                border: "1px solid var(--border-hairline)",
                gap: 12,
              }}
            >
              <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-secondary)" }}>
                Need realistic demo data to evaluate AI scoring?
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={applySamplePreset}
              >
                Fill sample account
              </button>
            </div>
          )}

          {shownError && (
            <div className="alert-banner alert-error" role="alert">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertIcon size={16} />
                <span>{shownError}</span>
              </div>
            </div>
          )}

          <div className="form-grid">
            <label className="form-field is-full">
              <span className="form-label">Company name *</span>
              <input
                className="form-input"
                type="text"
                required
                placeholder="e.g. NovaTech Solutions"
                value={form.company_name}
                onChange={(e) => setField("company_name", e.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Industry *</span>
              <input
                className="form-input"
                type="text"
                required
                placeholder="e.g. Enterprise Software"
                value={form.industry}
                onChange={(e) => setField("industry", e.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Pipeline stage</span>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                {LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Primary contact</span>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Arjun Mehta"
                value={form.contact_person ?? ""}
                onChange={(e) => setField("contact_person", e.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Work email</span>
              <input
                className="form-input"
                type="email"
                placeholder="arjun.mehta@novatech.io"
                value={form.email ?? ""}
                onChange={(e) => setField("email", e.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Phone</span>
              <input
                className="form-input"
                type="text"
                placeholder="+1 415 555 0142"
                value={form.phone ?? ""}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Website</span>
              <input
                className="form-input"
                type="text"
                placeholder="https://novatech.io"
                value={form.website ?? ""}
                onChange={(e) => setField("website", e.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Headcount range</span>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. 250-500"
                value={form.employee_count ?? ""}
                onChange={(e) => setField("employee_count", e.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Location</span>
              <input
                className="form-input"
                type="text"
                placeholder="San Francisco, USA"
                value={form.location ?? ""}
                onChange={(e) => setField("location", e.target.value)}
              />
            </label>

            <label className="form-field is-full">
              <span className="form-label">Technology stack</span>
              <input
                className="form-input"
                type="text"
                placeholder="Python, React, AWS, PostgreSQL, Kubernetes"
                value={form.technology_stack ?? ""}
                onChange={(e) => setField("technology_stack", e.target.value)}
              />
            </label>

            <label className="form-field is-full">
              <span className="form-label">Account context & buying signals</span>
              <textarea
                className="form-textarea"
                placeholder="Recent funding, operational bottlenecks, compliance needs, or integration plans..."
                value={form.description ?? ""}
                onChange={(e) => setField("description", e.target.value)}
              />
            </label>
          </div>
        </form>

        <div className="drawer-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="lead-drawer-form"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingLead
                ? "Save changes"
                : "Create prospect"}
          </button>
        </div>
      </div>
    </div>
  );
}
