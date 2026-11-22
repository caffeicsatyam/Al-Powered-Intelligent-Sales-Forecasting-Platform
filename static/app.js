(() => {
  "use strict";

  const API = "/api";
  const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];
  const STAGE_COLORS = ["#806cf0", "#6095ef", "#43b991", "#e7ae55", "#31ae83", "#df7880"];
  const state = { leads: [], activityChart: null, stageChart: null, analysis: null, currentView: "overview" };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers }
    });
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); }
      catch { throw new Error("The API returned an invalid response. Please try again."); }
    }
    if (!response.ok) {
      const detail = data?.detail;
      const message = Array.isArray(detail) ? detail.map((item) => item.msg).join(", ") : detail;
      throw new Error(message || `Request failed (${response.status}). Please try again.`);
    }
    return data;
  }

  function setLoading(active, message = "Loading your workspace…") {
    $("#loading-message").textContent = message;
    $("#loading-overlay").hidden = !active;
    document.body.setAttribute("aria-busy", String(active));
  }

  let bannerTimer;
  function showBanner(type, message) {
    const error = type === "error";
    const banner = $(error ? "#error-banner" : "#success-banner");
    const other = $(error ? "#success-banner" : "#error-banner");
    other.hidden = true;
    $(error ? "#error-message" : "#success-message").textContent = message;
    banner.hidden = false;
    window.clearTimeout(bannerTimer);
    if (!error) bannerTimer = window.setTimeout(() => { banner.hidden = true; }, 4000);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
  }

  function stageClass(status) {
    return `status-${String(status || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }

  function dateLabel(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function companyCell(lead) {
    return `<span class="company-cell"><span class="company-avatar">${escapeHtml(initials(lead.company_name))}</span><span>${escapeHtml(lead.company_name)}</span></span>`;
  }

  function leadRows(leads, actions = false) {
    return leads.map((lead) => `<tr>
      <td>${companyCell(lead)}</td>
      <td>${escapeHtml(lead.industry || "—")}</td>
      <td>${escapeHtml(lead.contact_person || "—")}</td>
      <td><span class="stage-pill ${stageClass(lead.status)}">${escapeHtml(lead.status)}</span></td>
      <td>${escapeHtml(dateLabel(lead.created_at))}</td>
      ${actions ? `<td><div class="row-actions"><button class="row-action" data-edit="${Number(lead.id)}" aria-label="Update ${escapeHtml(lead.company_name)} stage">Update stage</button><button class="row-action delete" data-delete="${Number(lead.id)}" aria-label="Delete ${escapeHtml(lead.company_name)}">Delete</button></div></td>` : ""}
    </tr>`).join("");
  }

  function updateOverview() {
    const leads = state.leads;
    const won = leads.filter((lead) => lead.status?.toLowerCase() === "won").length;
    $("#metric-total").textContent = leads.length;
    $("#metric-active").textContent = leads.filter((lead) => !["won", "lost"].includes(lead.status?.toLowerCase())).length;
    $("#metric-qualified").textContent = leads.filter((lead) => lead.status?.toLowerCase() === "qualified").length;
    $("#metric-won").textContent = won;
    $("#metric-win-note").textContent = leads.length ? `${Math.round(won / leads.length * 100)}% of current leads` : "No sales amount is tracked";
    const latest = [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
    $("#recent-leads").innerHTML = leadRows(latest);
    $("#recent-empty").hidden = latest.length > 0;
    updateCharts(leads);
  }

  function updateCharts(leads) {
    const colors = { color: "#969dac", borderColor: "#eceef4", gridColor: "#f0f1f5" };
    const sortedDates = [...Array(14)].map((_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (13 - index));
      return date;
    });
    const counts = sortedDates.map((date) => leads.filter((lead) => {
      const created = new Date(lead.created_at);
      return !Number.isNaN(created.getTime()) && created.toDateString() === date.toDateString();
    }).length);
    $("#activity-empty").hidden = leads.length > 0;
    $("#activity-chart").hidden = leads.length === 0;
    if (state.activityChart) state.activityChart.destroy();
    if (window.Chart && leads.length) {
      state.activityChart = new Chart($("#activity-chart"), {
        type: "line",
        data: {
          labels: sortedDates.map((date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" })),
          datasets: [{ data: counts, borderColor: "#7864ec", backgroundColor: (context) => {
            const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, context.chart.height);
            gradient.addColorStop(0, "rgba(120,100,236,.18)");
            gradient.addColorStop(1, "rgba(120,100,236,0)");
            return gradient;
          }, fill: true, tension: .38, borderWidth: 2, pointRadius: 2, pointHoverRadius: 4, pointBackgroundColor: "#7864ec" }]
        },
        options: {
          maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { displayColors: false, padding: 9, callbacks: { label: (context) => `${context.parsed.y} ${context.parsed.y === 1 ? "lead" : "leads"} added` } } },
          scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: colors.color, maxTicksLimit: 7, font: { size: 9 } } }, y: { beginAtZero: true, suggestedMax: Math.max(3, ...counts), grid: { color: colors.gridColor }, border: { display: false }, ticks: { color: colors.color, precision: 0, stepSize: 1, font: { size: 9 }, padding: 8 } } }
        }
      });
    } else state.activityChart = null;

    const stageCounts = STAGES.map((stage) => leads.filter((lead) => lead.status?.toLowerCase() === stage.toLowerCase()).length);
    const nonzero = stageCounts.some((count) => count > 0);
    $("#stage-empty").hidden = nonzero;
    $("#stage-chart").hidden = !nonzero;
    $("#stage-legend").innerHTML = STAGES.map((stage, index) => `<span class="legend-item"><span class="legend-dot" style="background:${STAGE_COLORS[index]}"></span>${escapeHtml(stage)} <strong>${stageCounts[index]}</strong></span>`).join("");
    if (state.stageChart) state.stageChart.destroy();
    if (window.Chart && nonzero) {
      state.stageChart = new Chart($("#stage-chart"), {
        type: "doughnut",
        data: { labels: STAGES, datasets: [{ data: stageCounts, backgroundColor: STAGE_COLORS, borderWidth: 3, borderColor: "#fff", hoverOffset: 4 }] },
        options: { maintainAspectRatio: false, cutout: "72%", plugins: { legend: { display: false }, tooltip: { padding: 9, callbacks: { label: (context) => ` ${context.label}: ${context.parsed}` } } } }
      });
    } else state.stageChart = null;
  }

  function updateLeadList() {
    const term = $("#lead-search").value.trim().toLowerCase();
    const status = $("#lead-filter").value.toLowerCase();
    const filtered = state.leads.filter((lead) => {
      const text = [lead.company_name, lead.industry, lead.contact_person].filter(Boolean).join(" ").toLowerCase();
      return text.includes(term) && (!status || lead.status?.toLowerCase() === status);
    });
    $("#lead-rows").innerHTML = leadRows(filtered, true);
    $("#lead-count").textContent = `${filtered.length} ${filtered.length === 1 ? "lead" : "leads"}`;
    $("#leads-empty").hidden = filtered.length > 0;
  }

  function updateAnalysisSelect() {
    const select = $("#analysis-lead");
    const selected = select.value;
    select.innerHTML = `<option value="">Choose a lead</option>${state.leads.map((lead) => `<option value="${Number(lead.id)}">${escapeHtml(lead.company_name)} · ${escapeHtml(lead.industry)}</option>`).join("")}`;
    if (state.leads.some((lead) => String(lead.id) === selected)) select.value = selected;
    $("#analyze-button").disabled = !select.value;
  }

  async function loadLeads({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    try {
      state.leads = await request("/leads/?limit=200");
      $("#api-dot").className = "status-dot online";
      $("#api-status").textContent = "API connected";
      updateOverview();
      updateLeadList();
      updateAnalysisSelect();
    } catch (error) {
      $("#api-dot").className = "status-dot offline";
      $("#api-status").textContent = "API unavailable";
      showBanner("error", `Could not load leads. ${error.message}`);
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  function showView(name) {
    state.currentView = name;
    $$(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${name}`));
    $$(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.view === name));
    const activeLink = $(`.nav-link[data-view="${name}"]`);
    $("#page-crumb").textContent = activeLink?.textContent.trim().replace("Soon", "").trim() || "Overview";
    $("#sidebar").classList.remove("mobile-open");
    if (name === "leads") updateLeadList();
    if (name === "intelligence") updateAnalysisSelect();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderAnalysis(data) {
    state.analysis = data;
    $("#analysis-score").textContent = data.qualification_score;
    $("#score-bar").style.width = `${Math.max(0, Math.min(100, Number(data.qualification_score) || 0))}%`;
    $("#analysis-action").textContent = data.recommended_action;
    $("#analysis-overview").textContent = data.company_overview;
    $("#analysis-industry").textContent = data.industry_analysis;
    const renderLines = (value) => {
      const lines = String(value || "").split(/\r?\n/).map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
      return lines.length ? lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("") : "<li>No details returned.</li>";
    };
    $("#analysis-needs").innerHTML = renderLines(data.business_needs);
    $("#analysis-opportunities").innerHTML = renderLines(data.opportunities);
    $("#analysis-result").hidden = false;
    $("#analysis-empty").hidden = true;
  }

  function openLeadDialog() {
    $("#lead-form").reset();
    $("#lead-dialog").showModal();
  }

  async function saveLead(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    for (const key of ["contact_person", "email", "phone", "website", "employee_count", "location", "description", "technology_stack"]) {
      if (!payload[key]) delete payload[key];
    }
    payload.status = "New";
    const saveButton = $("#save-lead");
    saveButton.disabled = true;
    saveButton.textContent = "Creating…";
    try {
      await request("/leads/", { method: "POST", body: JSON.stringify(payload) });
      $("#lead-dialog").close();
      await loadLeads({ quiet: true });
      showBanner("success", "Lead created successfully.");
    } catch (error) {
      showBanner("error", `Could not create lead. ${error.message}`);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Create lead";
    }
  }

  async function updateLeadStatus(id) {
    const lead = state.leads.find((item) => item.id === id);
    if (!lead) return;
    const newStatus = window.prompt(`Update stage for ${lead.company_name}:\n${STAGES.join(", ")}`, lead.status);
    if (newStatus === null || !newStatus.trim()) return;
    const status = STAGES.find((stage) => stage.toLowerCase() === newStatus.trim().toLowerCase());
    if (!status) {
      showBanner("error", `Choose one of these stages: ${STAGES.join(", ")}.`);
      return;
    }
    try {
      await request(`/leads/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      await loadLeads({ quiet: true });
      showBanner("success", `${lead.company_name} moved to ${status}.`);
    } catch (error) {
      showBanner("error", `Could not update lead. ${error.message}`);
    }
  }

  async function deleteLead(id) {
    const lead = state.leads.find((item) => item.id === id);
    if (!lead || !window.confirm(`Permanently delete ${lead.company_name}?`)) return;
    try {
      await request(`/leads/${id}`, { method: "DELETE" });
      await loadLeads({ quiet: true });
      showBanner("success", "Lead deleted successfully.");
    } catch (error) {
      showBanner("error", `Could not delete lead. ${error.message}`);
    }
  }

  async function analyzeLead() {
    const id = $("#analysis-lead").value;
    if (!id) return;
    const button = $("#analyze-button");
    button.disabled = true;
    button.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px"></span> Analyzing…';
    $("#analysis-empty").hidden = true;
    setLoading(true, "Generating company insights…");
    try {
      const result = await request(`/analysis/${encodeURIComponent(id)}`, { method: "POST" });
      renderAnalysis(result);
    } catch (error) {
      $("#analysis-empty").hidden = false;
      showBanner("error", `Company analysis failed. ${error.message}`);
    } finally {
      setLoading(false);
      button.innerHTML = "<span>✦</span> Generate insights";
      button.disabled = !$("#analysis-lead").value;
    }
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-view], [data-action], [data-edit], [data-delete]");
      if (!target) return;
      if (target.dataset.view) showView(target.dataset.view);
      if (target.dataset.action === "new-lead") openLeadDialog();
      if (target.dataset.edit) updateLeadStatus(Number(target.dataset.edit));
      if (target.dataset.delete) deleteLead(Number(target.dataset.delete));
    });
    $("#lead-search").addEventListener("input", updateLeadList);
    $("#lead-filter").addEventListener("change", updateLeadList);
    $("#analysis-lead").addEventListener("change", (event) => {
      $("#analyze-button").disabled = !event.target.value;
      $("#analysis-result").hidden = true;
      $("#analysis-empty").hidden = false;
    });
    $("#analyze-button").addEventListener("click", analyzeLead);
    $("#lead-form").addEventListener("submit", saveLead);
    $("#close-dialog").addEventListener("click", () => $("#lead-dialog").close());
    $("#cancel-dialog").addEventListener("click", () => $("#lead-dialog").close());
    $("#lead-dialog").addEventListener("click", (event) => { if (event.target === $("#lead-dialog")) $("#lead-dialog").close(); });
    $("#refresh-button").addEventListener("click", () => loadLeads());
    $("#dismiss-error").addEventListener("click", () => { $("#error-banner").hidden = true; });
    $("#dismiss-success").addEventListener("click", () => { $("#success-banner").hidden = true; });
    $("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("mobile-open"));
  }

  function init() {
    $("#current-year").textContent = new Date().getFullYear();
    bindEvents();
    loadLeads();
  }

  init();
})();
