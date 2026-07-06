from app.agents.state import CareerForgeState
from app.core.config import settings
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage
import json, logging, re

logger = logging.getLogger(__name__)

SYSTEM = """Analyse the resume against the job description. Return JSON:
{
  "ats_score": 0,
  "keyword_matches": ["string"],
  "missing_keywords": ["string"],
  "formatting_issues": ["string"],
  "rewrite_suggestions": [{"original": "string", "improved": "string", "reason": "string"}],
  "overall_verdict": "string"
}"""


def ats_optimization_node(state: CareerForgeState) -> dict:
    logger.info("[ATSAgent] Scoring ATS compatibility...")
    try:
        profile = state.get("resume_profile", {})
        jd = state.get("job_description") or "General software engineering role requiring Python, REST APIs, databases, version control, and collaborative development."

        text = f"""Skills on Resume: {profile.get('skills_explicit', [])}
Projects: {[p.get('name') for p in profile.get('projects', [])]}
Experience Level: {profile.get('experience_level')}
Profile Summary: {profile.get('profile_summary', '')}

Job Description:
{jd[:2000]}"""

        llm = ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=0.1,
            timeout=180,
            format="json",
        )
        response = llm.invoke([SystemMessage(content=SYSTEM), HumanMessage(content=text)])
        raw = response.content.strip()
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Strip markdown fences if model ignored format=json
            raw = re.sub(r"^```(?:json)?", "", raw, flags=re.MULTILINE).rstrip("` \n")
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                logger.error(f"[ATSAgent] JSON parse failed. Raw: {raw[:200]}")
                data = {}

        data.setdefault("ats_score", 50)
        data.setdefault("keyword_matches", [])
        data.setdefault("missing_keywords", [])
        data.setdefault("formatting_issues", [])
        data.setdefault("rewrite_suggestions", [])

        return {"ats_report": data, "completed_nodes": ["ats_agent"]}

    except Exception as e:
        logger.error(f"[ATSAgent] Error: {e}")
        return {
            "ats_report": {"ats_score": 50, "keyword_matches": [], "missing_keywords": [], "formatting_issues": [], "rewrite_suggestions": [], "overall_verdict": "ATS analysis failed."},
            "errors": [f"ATSAgent: {str(e)}"],
            "completed_nodes": ["ats_agent"],
        }
