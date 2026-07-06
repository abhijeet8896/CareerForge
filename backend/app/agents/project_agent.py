from app.agents.state import CareerForgeState
from app.core.config import settings
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage
import json, logging, re

logger = logging.getLogger(__name__)

SYSTEM = """Suggest 3 portfolio projects for this candidate. Return a JSON array of exactly 3 objects:
[
  {
    "title": "string",
    "description": "string",
    "tech_stack": ["string"],
    "why_recommended": "string",
    "skills_learned": ["string"],
    "portfolio_value": "high|medium|low",
    "estimated_hours": 0,
    "difficulty": "beginner|intermediate|advanced",
    "milestones": ["string"]
  }
]"""


def project_generator_node(state: CareerForgeState) -> dict:
    logger.info("[ProjectAgent] Generating project recommendations...")
    try:
        profile = state.get("resume_profile", {})
        market  = state.get("market_data", {})

        text = f"""Target Role: {state.get('target_role', 'Software Engineer')}
Current Skills: {profile.get('skills_explicit', [])}
Missing Critical Skills: {profile.get('missing_critical_skills', [])}
Market Gaps: {market.get('market_gaps', [])}
Experience Level: {profile.get('experience_level', 'fresher')}
Existing Projects: {[p.get('name') for p in profile.get('projects', [])]}"""

        llm = ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=0.5,
            timeout=180,
            format="json",
        )
        response = llm.invoke([SystemMessage(content=SYSTEM), HumanMessage(content=text)])
        raw = response.content.strip()
        try:
            projects = json.loads(raw)
        except json.JSONDecodeError:
            # Strip markdown fences if model ignored format=json
            raw = re.sub(r"^```(?:json)?", "", raw, flags=re.MULTILINE).rstrip("` \n")
            try:
                projects = json.loads(raw)
            except json.JSONDecodeError:
                logger.error(f"[ProjectAgent] JSON parse failed. Raw: {raw[:200]}")
                projects = []

        # Handle case where model wraps the array in an object
        if isinstance(projects, dict):
            # Try common wrapper keys
            for key in ("projects", "recommendations", "items", "data"):
                if key in projects and isinstance(projects[key], list):
                    projects = projects[key]
                    break
            else:
                projects = []

        if not isinstance(projects, list):
            projects = []

        return {"project_recommendations": projects, "completed_nodes": ["project_agent"]}

    except Exception as e:
        logger.error(f"[ProjectAgent] Error: {e}")
        return {
            "project_recommendations": [],
            "errors": [f"ProjectAgent: {str(e)}"],
            "completed_nodes": ["project_agent"],
        }
