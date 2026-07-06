from typing import TypedDict, Optional, Annotated
import operator


class CareerForgeState(TypedDict):
    # ── Inputs ────────────────────────────────────────────────────
    user_id: str
    session_id: str
    resume_text: str
    github_username: str
    target_role: str
    job_description: str

    # ── Agent outputs (all agents write to these) ─────────────────
    resume_profile: dict        # full structured profile from resume agent
    github_analysis: dict       # skill verification from github agent
    recruiter_feedback: dict    # simulation output
    ats_report: dict            # ATS scoring + rewrites
    market_data: dict           # market intelligence
    project_recommendations: list  # suggested projects
    roadmap: dict               # 180-day phased plan
    employability_score: float
    score_breakdown: dict

    # ── Reducers (safe for parallel nodes) ────────────────────────
    errors: Annotated[list, operator.add]
    completed_nodes: Annotated[list, operator.add]
