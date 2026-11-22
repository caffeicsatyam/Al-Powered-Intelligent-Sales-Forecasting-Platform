from frontend.app import main
import json
import os
from collections import Counter
from html import escape
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import streamlit as st


API_BASE_URL = os.getenv("SALES_API_URL", "http://127.0.0.1:8000").rstrip("/")
LEAD_STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"]


class ApiError(RuntimeError):
    """An API request failed or returned an unexpected response."""


def api_request(method: str, path: str, payload: dict | None = None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"

    request = Request(
        f"{API_BASE_URL}{path}",
        data=body,
        headers=headers,
        method=method,
    )
    try:
        with urlopen(request, timeout=10) as response:
            response_body = response.read()
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(error_body).get("detail", error_body)
        except (json.JSONDecodeError, AttributeError):
            detail = error_body or exc.reason
        raise ApiError(f"API request failed ({exc.code}): {detail}") from exc
    except URLError as exc:
        raise ApiError(
            f"Could not connect to the Sales API at {API_BASE_URL}: {exc.reason}"
        ) from exc

    if not response_body:
        return None
    try:
        return json.loads(response_body)
    except json.JSONDecodeError as exc:
        raise ApiError("The Sales API returned an invalid JSON response.") from exc


def get_leads(search: str = "", status: str = "All") -> list[dict]:
    params = {"limit": 200}
    if search.strip():
        params["search"] = search.strip()
    if status != "All":
        params["status"] = status
    return api_request("GET", f"/api/leads/?{urlencode(params)}")


def lead_label(lead: dict) -> str:
    return f"{lead['company_name']} · {lead['industry']} (#{lead['id']})"


def render_lead_table(leads: list[dict]) -> None:
    rows = [
        {
            "Company": lead["company_name"],
            "Industry": lead["industry"],
            "Contact": lead.get("contact_person") or "—",
            "Status": lead["status"],
            "Added": lead["created_at"][:10],
        }
        for lead in leads
    ]
    st.dataframe(rows, hide_index=True, width="stretch")


def render_dashboard(leads: list[dict]) -> None:
    st.title("Sales overview")
    st.caption("A live view of your prospect pipeline and lead activity.")

    total = len(leads)
    won = sum(lead["status"].lower() == "won" for lead in leads)
    qualified = sum(lead["status"].lower() == "qualified" for lead in leads)
    active = sum(lead["status"].lower() not in {"won", "lost"} for lead in leads)
    win_rate = f"{won / total:.0%}" if total else "—"

    metric_columns = st.columns(4)
    metric_columns[0].metric("Total leads", total, border=True)
    metric_columns[1].metric("Active pipeline", active, border=True)
    metric_columns[2].metric("Qualified", qualified, border=True)
    metric_columns[3].metric("Win rate", win_rate, border=True)

    if not leads:
        st.info("Your pipeline is empty. Add a lead to see your sales activity here.")
        return

    status_counts = Counter(lead["status"] for lead in leads)
    industry_counts = Counter(lead["industry"] for lead in leads)
    chart_columns = st.columns(2)
    with chart_columns[0]:
        with st.container(border=True):
            st.subheader("Pipeline by stage")
            stage_rows = [
                {"Stage": stage, "Leads": count}
                for stage, count in sorted(status_counts.items())
            ]
            st.bar_chart(
                stage_rows,
                x="Stage",
                y="Leads",
            )
    with chart_columns[1]:
        with st.container(border=True):
            st.subheader("Leads by industry")
            industry_rows = [
                {"Industry": industry, "Leads": count}
                for industry, count in industry_counts.most_common(8)
            ]
            st.bar_chart(
                industry_rows,
                x="Industry",
                y="Leads",
                horizontal=True,
            )

    with st.container(border=True):
        st.subheader("Recently added leads")
        render_lead_table(leads[:8])


def render_lead_management(leads: list[dict]) -> None:
    st.title("Lead management")
    st.caption("Create prospects, review your pipeline, and keep lead stages current.")

    with st.expander("Add a new lead", expanded=not leads):
        with st.form("create_lead_form", clear_on_submit=True):
            first_row = st.columns(2)
            company_name = first_row[0].text_input("Company name *")
            industry = first_row[1].text_input("Industry *")
            second_row = st.columns(2)
            contact_person = second_row[0].text_input("Contact person")
            email = second_row[1].text_input("Email")
            third_row = st.columns(2)
            phone = third_row[0].text_input("Phone")
            website = third_row[1].text_input("Website")
            location = st.text_input("Location")
            description = st.text_area("Company notes")
            submitted = st.form_submit_button(
                "Create lead", type="primary", width="stretch"
            )
            if submitted:
                if not company_name.strip() or not industry.strip():
                    st.error("Company name and industry are required.")
                else:
                    payload = {
                        "company_name": company_name.strip(),
                        "industry": industry.strip(),
                        "contact_person": contact_person.strip() or None,
                        "email": email.strip() or None,
                        "phone": phone.strip() or None,
                        "website": website.strip() or None,
                        "location": location.strip() or None,
                        "description": description.strip() or None,
                        "status": "New",
                    }
                    try:
                        api_request("POST", "/api/leads/", payload)
                    except ApiError as exc:
                        st.error(str(exc))
                    else:
                        st.success("Lead created.")
                        st.rerun()

    controls = st.columns([2, 1])
    search = controls[0].text_input("Search leads", placeholder="Company, industry, or contact")
    available_statuses = sorted({lead["status"] for lead in leads} | set(LEAD_STATUSES))
    selected_status = controls[1].selectbox(
        "Pipeline stage", ["All"] + available_statuses
    )
    try:
        visible_leads = get_leads(search, selected_status)
    except ApiError as exc:
        st.error(str(exc))
        return

    st.caption(f"{len(visible_leads)} lead{'s' if len(visible_leads) != 1 else ''}")
    if not visible_leads:
        st.info("No leads match these filters.")
        return

    render_lead_table(visible_leads)
    st.divider()
    st.subheader("Update a lead")
    selected_lead = st.selectbox(
        "Choose a lead",
        visible_leads,
        format_func=lead_label,
        key="lead_to_update",
    )
    status_options = sorted(set(LEAD_STATUSES) | {selected_lead["status"]})
    with st.form("update_lead_form"):
        new_status = st.selectbox(
            "Pipeline stage",
            status_options,
            index=status_options.index(selected_lead["status"]),
        )
        update_submitted = st.form_submit_button(
            "Save stage", type="primary", width="stretch"
        )
        if update_submitted:
            try:
                api_request(
                    "PUT",
                    f"/api/leads/{selected_lead['id']}",
                    {"status": new_status},
                )
            except ApiError as exc:
                st.error(str(exc))
            else:
                st.success("Lead stage updated.")
                st.rerun()

    with st.expander("Delete a lead"):
        confirmed = st.checkbox(
            f"I understand this permanently deletes {selected_lead['company_name']}.",
            key="confirm_lead_delete",
        )
        if st.button(
            "Delete lead",
            type="secondary",
            disabled=not confirmed,
            key="delete_lead_button",
        ):
            try:
                api_request("DELETE", f"/api/leads/{selected_lead['id']}")
            except ApiError as exc:
                st.error(str(exc))
            else:
                st.success("Lead deleted.")
                st.rerun()


def render_analysis(leads: list[dict]) -> None:
    st.title("Company intelligence")
    st.caption("Generate AI-powered company context, needs, and qualification guidance.")
    if not leads:
        st.info("Add a lead before generating company intelligence.")
        return

    selected_lead = st.selectbox(
        "Select a company",
        leads,
        format_func=lead_label,
        key="lead_to_analyze",
    )
    previous_analysis = st.session_state.get("analysis_result")
    if previous_analysis and previous_analysis["lead_id"] != selected_lead["id"]:
        st.session_state.pop("analysis_result", None)
        previous_analysis = None

    detail_columns = st.columns(3)
    detail_columns[0].metric("Pipeline stage", selected_lead["status"])
    detail_columns[1].metric("Industry", selected_lead["industry"])
    detail_columns[2].metric("Location", selected_lead.get("location") or "Not set")

    if st.button(
        "Generate company analysis",
        type="primary",
        icon=":material/auto_awesome:",
        width="stretch",
        key="generate_analysis",
    ):
        with st.spinner("Analyzing company profile..."):
            try:
                result = api_request(
                    "POST", f"/api/analysis/{selected_lead['id']}"
                )
            except ApiError as exc:
                st.error(str(exc))
            else:
                st.session_state["analysis_result"] = {
                    "lead_id": selected_lead["id"],
                    "data": result,
                }
                previous_analysis = st.session_state["analysis_result"]

    if not previous_analysis:
        st.info("Run an analysis to view qualification insights for this company.")
        return

    analysis = previous_analysis["data"]
    st.divider()
    score_columns = st.columns([1, 2])
    score_columns[0].metric(
        "Qualification score",
        f"{analysis['qualification_score']}/100",
        border=True,
    )
    with score_columns[1]:
        with st.container(border=True):
            st.markdown("**Recommended next step**")
            st.write(analysis["recommended_action"])

    with st.container(border=True):
        st.subheader("Company overview")
        st.write(analysis["company_overview"])
    insight_columns = st.columns(2)
    with insight_columns[0]:
        with st.container(border=True):
            st.subheader("Business needs")
            for need in filter(None, analysis["business_needs"].splitlines()):
                st.markdown(f"- {need}")
    with insight_columns[1]:
        with st.container(border=True):
            st.subheader("Potential opportunities")
            for opportunity in filter(None, analysis["opportunities"].splitlines()):
                st.markdown(f"- {opportunity}")
    with st.container(border=True):
        st.subheader("Industry analysis")
        st.write(analysis["industry_analysis"])


def render_score_gauge(score: int, label: str) -> None:
    angle = score * 3.6
    accessible_label = escape(label)
    st.html(
        f"""
        <div style="display:flex; flex-direction:column; align-items:center; gap:10px; padding:8px 0 12px">
          <div role="img" aria-label="Qualification score {score} out of 100"
               style="width:126px; height:126px; border-radius:50%;
                      background:conic-gradient(#2864e8 0deg {angle:.1f}deg,
                                               #e5eaf1 {angle:.1f}deg 360deg);
                      display:grid; place-items:center">
            <div style="width:102px; height:102px; border-radius:50%;
                        background:white; display:grid; place-items:center;
                        color:#15243b; font-size:30px; font-weight:700">
              {score}
            </div>
          </div>
          <div style="color:#68758a; font-size:14px">{accessible_label}</div>
        </div>
        """
    )


def render_outreach(leads: list[dict]) -> None:
    st.badge(
        "Milestone 2 · Weeks 3–4",
        icon=":material/auto_awesome:",
        color="blue",
    )
    st.header("Outreach generation & lead scoring")
    st.caption("Personalized email drafts, qualification signals, and next-step guidance.")
    if not leads:
        st.info("Add a lead before preparing outreach.")
        return

    selected_lead = st.selectbox(
        "Select a lead to review",
        leads,
        format_func=lead_label,
        key="lead_for_outreach",
    )
    lead_id = selected_lead["id"]
    st.caption("Qualification scores are heuristic guidance, not conversion probabilities.")

    try:
        score = api_request("GET", f"/api/outreach/{lead_id}/score")
        recommendations = api_request(
            "GET", f"/api/outreach/{lead_id}/recommendations"
        )
    except ApiError as exc:
        st.error(str(exc))
        return

    email_column, score_column, strategy_column = st.columns(
        [1.15, 0.9, 1.2], gap="medium"
    )
    draft_key = f"outreach_email_{lead_id}"
    subject_key = f"subject_{lead_id}"
    body_key = f"body_{lead_id}"

    with email_column:
        with st.container(border=True):
            email_header, draft_badge = st.columns([3, 1])
            email_header.markdown("**Email generator**")
            draft_badge.badge("Draft", icon=":material/edit:", color="violet")
            st.text_input(
                "To",
                value=selected_lead.get("email") or "",
                placeholder="No email saved for this lead",
                disabled=True,
                key=f"recipient_{lead_id}",
            )
            st.caption(
                "Generated from saved lead details and any company analysis."
            )
            if st.button(
                "Generate email draft",
                type="primary",
                icon=":material/auto_awesome:",
                width="stretch",
                key=f"generate_outreach_email_{lead_id}",
            ):
                with st.spinner("Preparing a draft..."):
                    try:
                        generated_draft = api_request(
                            "POST", f"/api/outreach/{lead_id}/email"
                        )
                        st.session_state[draft_key] = generated_draft
                        st.session_state[subject_key] = generated_draft["subject"]
                        st.session_state[body_key] = generated_draft["body"]
                    except ApiError as exc:
                        st.error(str(exc))

            draft = st.session_state.get(draft_key)
            st.text_input(
                "Subject",
                key=subject_key,
                disabled=not bool(draft),
                placeholder="Generate a draft to add a subject",
            )
            st.text_area(
                "Email body",
                height=220,
                key=body_key,
                disabled=not bool(draft),
                placeholder="Your editable email draft will appear here.",
            )
            st.caption("Review and edit the draft. This app does not send email.")

    with score_column:
        with st.container(border=True):
            st.markdown("**Lead score**")
            st.badge("Heuristic estimate", color="blue")
            score_value = int(score["score"])
            render_score_gauge(score_value, score["qualification_label"])
            st.caption("Qualification score · not a conversion probability")
            st.progress(score_value / 100)
            with st.expander("Scoring factors", expanded=True):
                st.caption(score["score_basis"])
                for factor in score["factors"]:
                    st.markdown(f"- {factor}")

    with strategy_column:
        with st.container(border=True):
            st.markdown("**Outreach strategy**")
            if recommendations["information_sufficient"]:
                st.badge("Ready to review", icon=":material/check_circle:", color="green")
            else:
                st.badge(
                    "More details needed",
                    icon=":material/info:",
                    color="orange",
                )

            with st.container(border=True):
                st.markdown("**Follow-up timing**")
                st.write(recommendations["follow_up_timing"])
            with st.container(border=True):
                st.markdown("**Suggested channel**")
                st.badge(recommendations["suggested_channel"], color="blue")
                st.write(recommendations["recommended_next_action"])
            with st.container(border=True):
                st.markdown("**Content strategy**")
                if selected_lead.get("description"):
                    st.write(
                        f"Use the saved company notes: {selected_lead['description']}"
                    )
                elif recommendations["information_sufficient"]:
                    st.write(
                        "Personalize from the saved company analysis. "
                        "No prior interaction history is stored."
                    )
                else:
                    st.write(
                        "Add company notes or generate a company analysis before outreach."
                    )
                st.markdown("**Engagement sequence**")
                for step in recommendations["engagement_sequence"]:
                    st.markdown(f"- {step}")

            if recommendations["missing_information"]:
                st.warning(
                    "Information to add: "
                    + ", ".join(recommendations["missing_information"])
                )


def main() -> None:
    st.set_page_config(
        page_title="Sales AI",
        page_icon=":material/insights:",
        layout="wide",
        initial_sidebar_state="collapsed",
    )

    page = st.segmented_control(
        "Workspace",
        [
            "Overview",
            "Lead management",
            "Company intelligence",
            "Sales outreach",
        ],
        default="Overview",
        key="workspace_navigation",
        width="stretch",
        label_visibility="collapsed",
        required=True,
    )

    try:
        leads = get_leads()
    except ApiError as exc:
        st.title("Sales AI")
        st.error(str(exc))
        st.info(
            "Start the FastAPI service, or set `SALES_API_URL` to the URL where it is running."
        )
        st.stop()

    if page == "Overview":
        render_dashboard(leads)
    elif page == "Lead management":
        render_lead_management(leads)
    elif page == "Company intelligence":
        render_analysis(leads)
    else:
        render_outreach(leads)



if __name__ == "__main__":
    main()
