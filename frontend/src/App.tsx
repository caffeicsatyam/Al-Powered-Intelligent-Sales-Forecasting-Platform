import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api/client";
import { DirectoryView } from "./components/DirectoryView";
import { ForecastView } from "./components/ForecastView";
import {
  AlertIcon,
  BrandEmblem,
  DirectoryIcon,
  ForecastIcon,
  LogOutIcon,
  MenuIcon,
  ModelIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  WorkbenchIcon,
} from "./components/Icons";
import { LandingPage } from "./components/LandingPage";
import { LeadFormDrawer } from "./components/LeadFormDrawer";
import { ModelArchitectureView } from "./components/ModelArchitectureView";
import { WorkbenchView } from "./components/WorkbenchView";
import { SAMPLE_PROSPECTS } from "./data/sampleProspects";
import type {
  Lead,
  LeadCreatePayload,
  LeadIntelligenceBundle,
  ScoreRequest,
  WorkbenchTab,
  WorkspaceView,
} from "./types/sales";

interface ToastMessage {
  id: number;
  text: string;
}

const VIEW_TITLES: Record<WorkspaceView, string> = {
  forecast: "Forecast & Pipeline",
  directory: "Prospect Directory",
  workbench: "Account Workbench",
  model: "ML Model & Architecture",
};

const VALID_VIEWS: readonly WorkspaceView[] = [
  "forecast",
  "directory",
  "workbench",
  "model",
];

function parseHashState(): { entered: boolean; view: WorkspaceView } {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (VALID_VIEWS.includes(raw as WorkspaceView)) {
    return { entered: true, view: raw as WorkspaceView };
  }
  return { entered: false, view: "forecast" };
}

export function App() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "degraded">("checking");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [intelligence, setIntelligence] = useState<
    Record<number, LeadIntelligenceBundle>
  >({});
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const initialRoute = useMemo(() => parseHashState(), []);
  const [isEntered, setIsEntered] = useState<boolean>(initialRoute.entered);
  const [operatorEmail, setOperatorEmail] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem("salesgenie_operator_email");
    } catch {
      return null;
    }
  });
  const [activeView, setActiveView] = useState<WorkspaceView>(initialRoute.view);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [workbenchTab, setWorkbenchTab] = useState<WorkbenchTab>("intelligence");
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const [seedingSamples, setSeedingSamples] = useState(false);
  const [analyzingLeadIds, setAnalyzingLeadIds] = useState<Record<number, boolean>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(1);

  const notify = useCallback((text: string) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const hydrateLeadIntel = useCallback(async (leadList: Lead[]) => {
    const entries = await Promise.all(
      leadList.map(async (lead) => {
        const [analysisRes, scoreRes, emailsRes] = await Promise.allSettled([
          api.getLatestAnalysis(lead.id),
          api.getLatestScore(lead.id),
          api.listEmails(lead.id),
        ]);

        return [
          lead.id,
          {
            analysis: analysisRes.status === "fulfilled" ? analysisRes.value : null,
            score: scoreRes.status === "fulfilled" ? scoreRes.value : null,
            emails: emailsRes.status === "fulfilled" ? emailsRes.value : [],
            recommendation: null,
          } satisfies LeadIntelligenceBundle,
        ] as const;
      })
    );

    setIntelligence((prev) => {
      const next: Record<number, LeadIntelligenceBundle> = {};
      for (const [id, bundle] of entries) {
        next[id] = {
          ...bundle,
          recommendation: prev[id]?.recommendation ?? null,
        };
      }
      return next;
    });
  }, []);

  const refreshWorkspace = useCallback(async () => {
    setLoading(true);
    setGlobalError(null);
    setApiStatus("checking");

    try {
      await api.checkHealth();
      setApiStatus("online");
    } catch {
      setApiStatus("degraded");
    }

    try {
      const fetchedLeads = await api.listLeads({ limit: 200 });
      setLeads(fetchedLeads);
      setSelectedLeadId((prev) => {
        if (prev && fetchedLeads.some((l) => l.id === prev)) return prev;
        return fetchedLeads[0]?.id ?? null;
      });
      await hydrateLeadIntel(fetchedLeads);
      setApiStatus("online");
    } catch (err) {
      setApiStatus("degraded");
      setGlobalError(
        err instanceof Error
          ? `Unable to reach SalesGenie API: ${err.message}`
          : "Unable to load leads from the backend server."
      );
    } finally {
      setLoading(false);
    }
  }, [hydrateLeadIntel]);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  // Keyboard shortcut: '/' or Ctrl/Cmd+K focuses global account search
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === "k" && (event.ctrlKey || event.metaKey)) ||
        (event.key === "/" &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA" &&
          document.activeElement?.tagName !== "SELECT")
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === "Escape") {
        setSearchFocused(false);
        setMobileRailOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return leads
      .filter(
        (l) =>
          l.company_name.toLowerCase().includes(q) ||
          l.industry.toLowerCase().includes(q) ||
          (l.contact_person ?? "").toLowerCase().includes(q)
      )
      .slice(0, 7);
  }, [leads, searchQuery]);

  const openLeadInWorkbench = (leadId: number, tab?: WorkbenchTab) => {
    setSelectedLeadId(leadId);
    if (tab) setWorkbenchTab(tab);
    setActiveView("workbench");
    setSearchQuery("");
    setSearchFocused(false);
    setMobileRailOpen(false);
  };

  const handleSaveLeadForm = async (
    payload: LeadCreatePayload,
    editingLeadId?: number
  ) => {
    setDrawerSaving(true);
    setDrawerError(null);
    try {
      if (editingLeadId) {
        const updated = await api.updateLead(editingLeadId, payload);
        setLeads((prev) =>
          prev.map((l) => (l.id === editingLeadId ? updated : l))
        );
        notify(`Updated ${updated.company_name}`);
      } else {
        const created = await api.createLead(payload);
        setLeads((prev) => [created, ...prev]);
        setIntelligence((prev) => ({
          ...prev,
          [created.id]: {
            analysis: null,
            score: null,
            emails: [],
            recommendation: null,
          },
        }));
        setSelectedLeadId(created.id);
        setActiveView("workbench");
        setWorkbenchTab("intelligence");
        notify(`Created prospect ${created.company_name}`);
      }
      setDrawerOpen(false);
      setEditingLead(null);
    } catch (err) {
      setDrawerError(
        err instanceof Error ? err.message : "Failed to save prospect."
      );
    } finally {
      setDrawerSaving(false);
    }
  };

  const handleUpdateStage = async (leadId: number, status: string) => {
    try {
      const updated = await api.updateLead(leadId, { status });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      notify(`${updated.company_name} moved to ${status}`);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to update pipeline stage"
      );
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    try {
      await api.deleteLead(lead.id);
      const remaining = leads.filter((l) => l.id !== lead.id);
      setLeads(remaining);
      setIntelligence((prev) => {
        const copy = { ...prev };
        delete copy[lead.id];
        return copy;
      });
      if (selectedLeadId === lead.id) {
        setSelectedLeadId(remaining[0]?.id ?? null);
        if (remaining.length === 0) setActiveView("forecast");
      }
      notify(`Deleted ${lead.company_name}`);
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? `Could not delete ${lead.company_name}: ${err.message}`
          : `Could not delete ${lead.company_name}.`
      );
    }
  };

  const handleRunAnalysis = async (leadId: number) => {
    setAnalyzingLeadIds((prev) => ({ ...prev, [leadId]: true }));
    try {
      const analysis = await api.runAnalysis(leadId);
      setIntelligence((prev) => ({
        ...prev,
        [leadId]: {
          analysis,
          score: prev[leadId]?.score ?? null,
          emails: prev[leadId]?.emails ?? [],
          recommendation: prev[leadId]?.recommendation ?? null,
        },
      }));
      notify("Company intelligence brief generated");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "AI analysis request failed";
      notify(msg);
      throw err;
    } finally {
      setAnalyzingLeadIds((prev) => {
        const copy = { ...prev };
        delete copy[leadId];
        return copy;
      });
    }
  };

  const handleSubmitScore = async (leadId: number, payload: ScoreRequest) => {
    const score = await api.predictScore(leadId, payload);
    setIntelligence((prev) => ({
      ...prev,
      [leadId]: {
        analysis: prev[leadId]?.analysis ?? null,
        score,
        emails: prev[leadId]?.emails ?? [],
        recommendation: prev[leadId]?.recommendation ?? null,
      },
    }));
    notify(
      `Saved score ${score.total_score}/100 · ML Prob ${score.conversation_probability ?? "N/A"}%`
    );
  };

  const handleGenerateEmail = async (
    leadId: number,
    payload: { tone: string; service_offered: string; additional_context?: string }
  ) => {
    const email = await api.generateEmail(leadId, payload);
    setIntelligence((prev) => ({
      ...prev,
      [leadId]: {
        analysis: prev[leadId]?.analysis ?? null,
        score: prev[leadId]?.score ?? null,
        emails: [email, ...(prev[leadId]?.emails ?? [])],
        recommendation: prev[leadId]?.recommendation ?? null,
      },
    }));
    notify("Outreach draft generated and saved");
  };

  const handleGenerateRecommendation = async (leadId: number) => {
    const rec = await api.generateRecommendation(leadId);
    setIntelligence((prev) => ({
      ...prev,
      [leadId]: {
        analysis: prev[leadId]?.analysis ?? null,
        score: prev[leadId]?.score ?? null,
        emails: prev[leadId]?.emails ?? [],
        recommendation: rec,
      },
    }));
    notify("Outreach strategy updated");
  };

  const handleQuickSaveEmail = async (leadId: number, email: string) => {
    try {
      const updated = await api.updateLead(leadId, { email });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      notify(`Saved contact email for ${updated.company_name}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Invalid email address");
    }
  };

  const handleSeedSamples = async () => {
    setSeedingSamples(true);
    try {
      const existingNames = new Set(
        leads.map((l) => l.company_name.toLowerCase())
      );
      const toInsert = SAMPLE_PROSPECTS.filter(
        (s) => !existingNames.has(s.company_name.toLowerCase())
      );
      await Promise.all(toInsert.map((item) => api.createLead(item)));
      await refreshWorkspace();
      notify(`Added ${toInsert.length} sample B2B prospects`);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Failed to seed sample accounts."
      );
    } finally {
      setSeedingSamples(false);
    }
  };

  const navigate = useCallback((view: WorkspaceView) => {
    setActiveView(view);
    setMobileRailOpen(false);
    window.location.hash = `#/${view}`;
  }, []);

  const enterWorkspace = useCallback(
    (view: WorkspaceView = "forecast", signedEmail?: string | null) => {
      if (signedEmail !== undefined) {
        setOperatorEmail(signedEmail);
        try {
          if (signedEmail) {
            window.sessionStorage.setItem("salesgenie_operator_email", signedEmail);
          } else {
            window.sessionStorage.removeItem("salesgenie_operator_email");
          }
        } catch {
          // Ignore storage errors in restricted environments
        }
      }
      setIsEntered(true);
      setActiveView(view);
      setMobileRailOpen(false);
      window.location.hash = `#/${view}`;
      window.scrollTo({ top: 0 });
    },
    []
  );

  const exitToLanding = useCallback(() => {
    setIsEntered(false);
    setMobileRailOpen(false);
    window.location.hash = "#/";
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (isEntered) {
      const target = `#/${activeView}`;
      if (window.location.hash !== target) {
        window.location.hash = target;
      }
    }
  }, [isEntered, activeView]);

  useEffect(() => {
    const onHashChange = () => {
      const next = parseHashState();
      setIsEntered(next.entered);
      if (next.entered) {
        setActiveView(next.view);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const landingStats = useMemo(() => {
    const analyzedCount = leads.filter((l) => Boolean(intelligence[l.id]?.analysis)).length;
    const scoredCount = leads.filter(
      (l) => typeof intelligence[l.id]?.score?.conversation_probability === "number"
    ).length;
    return {
      leadCount: leads.length,
      analyzedCount,
      scoredCount,
    };
  }, [leads, intelligence]);

  if (!isEntered) {
    return (
      <LandingPage
        apiStatus={apiStatus}
        leadCount={landingStats.leadCount}
        scoredCount={landingStats.scoredCount}
        analyzedCount={landingStats.analyzedCount}
        operatorEmail={operatorEmail}
        onEnterWorkspace={enterWorkspace}
      />
    );
  }

  return (
    <div className="app-shell">
      {mobileRailOpen && (
        <div
          className="rail-backdrop"
          onClick={() => setMobileRailOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Navigation Rail */}
      <aside
        className={`app-rail ${mobileRailOpen ? "is-open" : ""}`}
        aria-label="Primary workspace navigation"
      >
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <button
            type="button"
            className="rail-brand-btn"
            title="Return to SalesGenie AI entry page"
            onClick={exitToLanding}
          >
            <BrandEmblem size={30} />
            <div className="rail-brand-title">
              <span className="rail-brand-name">SalesGenie AI</span>
              <span className="rail-brand-sub">Lead Intelligence Suite</span>
            </div>
          </button>

          <nav className="rail-nav">
            <button
              type="button"
              className={`rail-nav-btn ${activeView === "forecast" ? "is-active" : ""}`}
              onClick={() => navigate("forecast")}
            >
              <span className="rail-nav-btn-inner">
                <ForecastIcon size={17} className="rail-nav-icon" />
                <span>Forecast &amp; Pipeline</span>
              </span>
              <span className="rail-count">{leads.length}</span>
            </button>

            <button
              type="button"
              className={`rail-nav-btn ${activeView === "directory" ? "is-active" : ""}`}
              onClick={() => navigate("directory")}
            >
              <span className="rail-nav-btn-inner">
                <DirectoryIcon size={17} className="rail-nav-icon" />
                <span>Prospect Directory</span>
              </span>
            </button>

            <button
              type="button"
              className={`rail-nav-btn ${activeView === "workbench" ? "is-active" : ""}`}
              onClick={() => navigate("workbench")}
            >
              <span className="rail-nav-btn-inner">
                <WorkbenchIcon size={17} className="rail-nav-icon" />
                <span>Account Workbench</span>
              </span>
            </button>

            <button
              type="button"
              className={`rail-nav-btn ${activeView === "model" ? "is-active" : ""}`}
              onClick={() => navigate("model")}
            >
              <span className="rail-nav-btn-inner">
                <ModelIcon size={17} className="rail-nav-icon" />
                <span>ML Model &amp; Architecture</span>
              </span>
            </button>
          </nav>

          {leads.length > 0 && (
            <>
              <div className="rail-section-label">Active accounts</div>
              <div className="rail-recent-list">
                {leads.slice(0, 10).map((lead) => {
                  const prob =
                    intelligence[lead.id]?.score?.conversation_probability;
                  const isSelected =
                    activeView === "workbench" && selectedLeadId === lead.id;
                  return (
                    <button
                      key={lead.id}
                      type="button"
                      className={`rail-lead-btn ${isSelected ? "is-selected" : ""}`}
                      onClick={() => openLeadInWorkbench(lead.id)}
                    >
                      <span className="rail-lead-name">{lead.company_name}</span>
                      <span
                        className="tabular"
                        style={{ fontSize: "11px", opacity: 0.8, flexShrink: 0 }}
                      >
                        {typeof prob === "number"
                          ? `${prob.toFixed(0)}%`
                          : lead.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="rail-footer">
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={() => {
              setEditingLead(null);
              setDrawerError(null);
              setDrawerOpen(true);
              setMobileRailOpen(false);
            }}
          >
            <PlusIcon size={15} />
            New Prospect
          </button>

          <div className="api-status-row" title="FastAPI health endpoint status">
            <span>
              <span
                className={`api-status-dot ${
                  apiStatus === "online"
                    ? "is-online"
                    : apiStatus === "degraded"
                      ? "is-degraded"
                      : "is-checking"
                }`}
              />
              {apiStatus === "online"
                ? "API connected"
                : apiStatus === "degraded"
                  ? "API unreachable"
                  : "Checking API..."}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ height: 22, padding: "0 6px" }}
              onClick={() => void refreshWorkspace()}
              aria-label="Refresh workspace data"
            >
              <RefreshIcon size={12} />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", justifyContent: "space-between", padding: "0 8px" }}
            onClick={exitToLanding}
            title="Return to pre-login entry page"
          >
            <span className="rail-lead-name">
              {operatorEmail ? operatorEmail : "Exit to Entry Page"}
            </span>
            <LogOutIcon size={13} />
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileRailOpen(true)}
              aria-label="Open navigation menu"
            >
              <MenuIcon size={18} />
            </button>
            <h1 className="topbar-title">
              {activeView === "workbench" && selectedLead
                ? `${VIEW_TITLES[activeView]} — ${selectedLead.company_name}`
                : VIEW_TITLES[activeView]}
            </h1>
          </div>

          <div className="topbar-actions">
            <div className="command-search-wrap">
              <SearchIcon size={15} className="command-search-icon" />
              <input
                ref={searchInputRef}
                type="search"
                className="command-search-input"
                placeholder="Jump to account..."
                aria-label="Jump to account"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchMatches[0]) {
                    openLeadInWorkbench(searchMatches[0].id);
                  }
                }}
              />
              <span className="command-kbd">/</span>

              {searchFocused && searchQuery.trim() && (
                <div className="search-dropdown" role="listbox">
                  {searchMatches.length === 0 ? (
                    <div style={{ padding: "10px 12px", fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                      No matching prospects
                    </div>
                  ) : (
                    searchMatches.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="search-dropdown-item"
                        onMouseDown={() => openLeadInWorkbench(item.id)}
                      >
                        <span>
                          <strong style={{ display: "block" }}>
                            {item.company_name}
                          </strong>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)" }}>
                            {item.industry}
                          </span>
                        </span>
                        <span className={`stage-badge stage-${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingLead(null);
                setDrawerError(null);
                setDrawerOpen(true);
              }}
            >
              <PlusIcon size={15} />
              Add Prospect
            </button>
          </div>
        </header>

        <main className="page-content">
          {globalError && (
            <div className="alert-banner alert-error" role="alert">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertIcon size={16} />
                <span>{globalError}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => void refreshWorkspace()}
              >
                Retry
              </button>
            </div>
          )}

          {activeView === "forecast" && (
            <ForecastView
              leads={leads}
              intelligence={intelligence}
              loading={loading}
              seedingSamples={seedingSamples}
              analyzingLeadIds={analyzingLeadIds}
              onOpenLead={(id) => openLeadInWorkbench(id)}
              onUpdateStage={handleUpdateStage}
              onRunQuickAnalysis={handleRunAnalysis}
              onOpenCreateDrawer={() => {
                setEditingLead(null);
                setDrawerError(null);
                setDrawerOpen(true);
              }}
              onSeedSamples={handleSeedSamples}
            />
          )}

          {activeView === "directory" && (
            <DirectoryView
              leads={leads}
              intelligence={intelligence}
              onOpenLead={(id) => openLeadInWorkbench(id)}
              onEditLead={(lead) => {
                setEditingLead(lead);
                setDrawerError(null);
                setDrawerOpen(true);
              }}
              onDeleteLead={handleDeleteLead}
              onOpenCreateDrawer={() => {
                setEditingLead(null);
                setDrawerError(null);
                setDrawerOpen(true);
              }}
            />
          )}

          {activeView === "workbench" && (
            <WorkbenchView
              lead={selectedLead}
              leads={leads}
              intel={selectedLead ? intelligence[selectedLead.id] : undefined}
              activeTab={workbenchTab}
              onChangeTab={setWorkbenchTab}
              onSelectLead={(id) => setSelectedLeadId(id)}
              onUpdateStage={handleUpdateStage}
              onEditLead={(lead) => {
                setEditingLead(lead);
                setDrawerError(null);
                setDrawerOpen(true);
              }}
              onDeleteLead={handleDeleteLead}
              onRunAnalysis={handleRunAnalysis}
              onSubmitScore={handleSubmitScore}
              onGenerateEmail={handleGenerateEmail}
              onGenerateRecommendation={handleGenerateRecommendation}
              onQuickSaveEmail={handleQuickSaveEmail}
              onNotify={notify}
            />
          )}

          {activeView === "model" && <ModelArchitectureView />}
        </main>
      </div>

      {/* Prospect Add / Edit Slide-Over Drawer */}
      <LeadFormDrawer
        open={drawerOpen}
        editingLead={editingLead}
        saving={drawerSaving}
        error={drawerError}
        onClose={() => {
          setDrawerOpen(false);
          setEditingLead(null);
        }}
        onSubmit={handleSaveLeadForm}
      />

      {/* Live Toast Feedback */}
      {toasts.length > 0 && (
        <div className="toast-stack" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className="toast-item">
              {toast.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
