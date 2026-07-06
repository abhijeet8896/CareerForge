from app.agents.state import CareerForgeState
from app.core.config import settings
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage
import json, logging, re

logger = logging.getLogger(__name__)

SYSTEM = """Review this candidate profile as a technical recruiter. Return JSON:
{
  "shortlist_probability": 0.0,
  "first_impression": "string",
  "recruiter_verdict": "strong_yes|yes|maybe|no|strong_no",
  "rejection_reasons": ["string"],
  "strengths": ["string"],
  "concerns": ["string"],
  "feedback": "string",
  "suggested_improvements": ["string"]
}"""


def recruiter_simulation_node(state: CareerForgeState) -> dict:
    logger.info("[RecruiterAgent] Simulating recruiter review...")
    try:
        profile = state.get("resume_profile", {})
        github  = state.get("github_analysis", {})
        verified = [s["skill"] for s in github.get("verified_skills", []) if s.get("verdict") == "verified"]

        brief = f"""Target Role: {state.get('target_role', 'Software Engineer')}
Experience Level: {profile.get('experience_level', 'unknown')}
Skills on Resume: {', '.join(profile.get('skills_explicit', [])) or 'none listed'}
Projects Count: {len(profile.get('projects', []))}
GitHub Repos Analysed: {github.get('repos_analyzed', 0)}
Skills Verified in Code: {', '.join(verified) or 'none'}
Key Weaknesses: {', '.join(profile.get('weaknesses', [])) or 'none identified'}
Profile Summary: {profile.get('profile_summary', 'N/A')}
Job Description: {(state.get('job_description') or 'General software engineering role')[:800]}"""

        llm = ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=0.3,
            timeout=180,
            format="json",
        )
        response = llm.invoke([SystemMessage(content=SYSTEM), HumanMessage(content=brief)])
        raw = response.content.strip()
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Strip markdown fences if model ignored format=json
            raw = re.sub(r"^```(?:json)?", "", raw, flags=re.MULTILINE).rstrip("` \n")
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                logger.error(f"[RecruiterAgent] JSON parse failed. Raw: {raw[:200]}")
                data = {}

        # Ensure expected keys
        data.setdefault("shortlist_probability", 0.35)
        data.setdefault("recruiter_verdict", "maybe")
        data.setdefault("rejection_reasons", [])
        data.setdefault("strengths", [])
        data.setdefault("concerns", [])
        data.setdefault("suggested_improvements", [])

        return {"recruiter_feedback": data, "completed_nodes": ["recruiter_agent"]}

    except Exception as e:
        logger.error(f"[RecruiterAgent] Error: {e}")
        return {
            "recruiter_feedback": {
                "shortlist_probability": 0.35,
                "first_impression": "Analysis unavailable.",
                "recruiter_verdict": "maybe",
                "rejection_reasons": [],
                "strengths": [],
                "concerns": [],
                "feedback": "Recruiter simulation failed.",
                "suggested_improvements": [],
            },
            "errors": [f"RecruiterAgent: {str(e)}"],
            "completed_nodes": ["recruiter_agent"],
        }
