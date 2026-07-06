from app.agents.state import CareerForgeState
from app.core.config import settings
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage
import json, logging, re

logger = logging.getLogger(__name__)

SYSTEM = """Create a 180-day learning roadmap. Return JSON:
{
  "phase_1": {"label": "0-30 days", "focus": "string", "goals": ["string"], "resources": [{"skill": "string", "resource": "string", "url": "string"}]},
  "phase_2": {"label": "30-60 days", "focus": "string", "goals": ["string"], "resources": []},
  "phase_3": {"label": "60-90 days", "focus": "string", "goals": ["string"], "resources": []},
  "phase_4": {"label": "90-180 days", "focus": "string", "goals": ["string"], "resources": []},
  "summary": "string"
}"""


def roadmap_planner_node(state: CareerForgeState) -> dict:
    logger.info("[RoadmapAgent] Building learning roadmap...")
    try:
        profile  = state.get("resume_profile", {})
        projects = state.get("project_recommendations", [])

        text = f"""Target Role: {state.get('target_role', 'Software Engineer')}
Current Skills: {profile.get('skills_explicit', [])}
Missing Critical Skills: {profile.get('missing_critical_skills', [])}
Experience Level: {profile.get('experience_level', 'fresher')}
Weaknesses: {profile.get('weaknesses', [])}
Recommended Projects: {[p.get('title') for p in projects]}"""

        llm = ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=0.3,
            timeout=180,
            format="json",
        )
        response = llm.invoke([SystemMessage(content=SYSTEM), HumanMessage(content=text)])
        raw = response.content.strip()
        try:
            roadmap = json.loads(raw)
        except json.JSONDecodeError:
            # Strip markdown fences if model ignored format=json
            raw = re.sub(r"^```(?:json)?", "", raw, flags=re.MULTILINE).rstrip("` \n")
            try:
                roadmap = json.loads(raw)
            except json.JSONDecodeError:
                logger.error(f"[RoadmapAgent] JSON parse failed. Raw: {raw[:200]}")
                roadmap = {}

        if not isinstance(roadmap, dict):
            logger.error(f"[RoadmapAgent] Expected dict, got {type(roadmap)}")
            roadmap = {}

        return {"roadmap": roadmap, "completed_nodes": ["roadmap_agent"]}

    except Exception as e:
        logger.error(f"[RoadmapAgent] Error: {e}")
        return {
            "roadmap": {},
            "errors": [f"RoadmapAgent: {str(e)}"],
            "completed_nodes": ["roadmap_agent"],
        }
