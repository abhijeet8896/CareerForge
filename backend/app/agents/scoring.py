from app.agents.state import CareerForgeState

# Weights must sum to 1.0
WEIGHTS = {
    "technical_readiness":  0.20,
    "portfolio_strength":   0.15,
    "github_quality":       0.15,
    "recruiter_confidence": 0.15,
    "ats_compatibility":    0.10,
    "market_relevance":     0.10,
    "project_quality":      0.10,
    "skill_authenticity":   0.05,
}


def _clamp(val: float) -> float:
    return max(0.0, min(100.0, float(val)))


def score_aggregation_node(state: CareerForgeState) -> dict:
    profile   = state.get("resume_profile", {})
    github    = state.get("github_analysis", {})
    recruiter = state.get("recruiter_feedback", {})
    ats       = state.get("ats_report", {})
    market    = state.get("market_data", {})
    projects  = state.get("project_recommendations", [])

    skills   = profile.get("skills_explicit", [])
    verified = [s for s in github.get("verified_skills", []) if s.get("verdict") == "verified"]

    breakdown = {
        # More skills → higher technical readiness (cap at 100)
        "technical_readiness":  _clamp(len(skills) * 6),
        # Each project worth 20 pts
        "portfolio_strength":   _clamp(len(profile.get("projects", [])) * 20),
        # GitHub: repos analyzed + verified skills
        "github_quality":       _clamp(github.get("repos_analyzed", 0) * 8 + len(verified) * 10),
        # Direct from ATS agent
        "ats_compatibility":    _clamp(ats.get("ats_score", 50)),
        # Direct from market agent
        "market_relevance":     _clamp(market.get("demand_score", 55)),
        # Recruiter shortlist probability → 0-100
        "recruiter_confidence": _clamp(recruiter.get("shortlist_probability", 0.35) * 100),
        # Each recommended project adds 33 pts
        "project_quality":      _clamp(len(projects) * 33),
        # Ratio of verified-to-claimed skills
        "skill_authenticity":   _clamp(len(verified) / max(len(skills), 1) * 100),
    }

    final = round(sum(breakdown[k] * WEIGHTS[k] for k in WEIGHTS), 1)

    return {
        "employability_score": final,
        "score_breakdown": breakdown,
        "completed_nodes": ["score_aggregator"],
    }
