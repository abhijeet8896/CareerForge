from app.agents.state import CareerForgeState
from app.core.config import settings
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage
import json, logging, re

logger = logging.getLogger(__name__)

SYSTEM = """Analyse job market demand for the candidate. Return JSON:
{
  "demand_score": 0,
  "trending_skills": [{"skill": "string", "demand": 0, "trend": "rising|stable|declining", "rationale": "string"}],
  "declining_skills": [{"skill": "string", "rationale": "string"}],
  "market_gaps": ["string"],
  "salary_range": {"min": 0, "max": 0, "currency": "INR"},
  "top_hiring_companies": ["string"],
  "remote_opportunities": "high|medium|low",
  "market_summary": "string"
}"""


def market_intelligence_node(state: CareerForgeState) -> dict:
    logger.info("[MarketAgent] Analysing market demand...")
    try:
        profile = state.get("resume_profile", {})
        text = f"""Target Role: {state.get('target_role', 'Software Engineer')}
Current Skills: {profile.get('skills_explicit', [])}
Missing Skills: {profile.get('missing_critical_skills', [])}
Experience Level: {profile.get('experience_level', 'fresher')}"""

        llm = ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=0.2,
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
                logger.error(f"[MarketAgent] JSON parse failed. Raw: {raw[:200]}")
                data = {}

        data.setdefault("demand_score", 55)
        data.setdefault("trending_skills", [])
        data.setdefault("declining_skills", [])
        data.setdefault("market_gaps", [])
        data.setdefault("market_summary", "")

        return {"market_data": data, "completed_nodes": ["market_agent"]}

    except Exception as e:
        logger.error(f"[MarketAgent] Error: {e}")
        return {
            "market_data": {"demand_score": 55, "trending_skills": [], "declining_skills": [], "market_gaps": [], "market_summary": "Market analysis failed."},
            "errors": [f"MarketAgent: {str(e)}"],
            "completed_nodes": ["market_agent"],
        }
