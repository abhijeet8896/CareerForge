from app.agents.state import CareerForgeState
from app.core.config import settings
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage
import json, logging, re

logger = logging.getLogger(__name__)

SYSTEM = """Extract information from the resume text and return JSON with exactly these keys:
{
  "skills_explicit": ["string"],
  "skills_inferred": [{"skill": "string", "source": "string", "confidence": 0.0}],
  "weaknesses": ["string"],
  "experience_level": "fresher|junior|mid|senior",
  "profile_summary": "string",
  "education": {"degree": "string", "institution": "string", "year": "string"},
  "projects": [{"name": "string", "tech_stack": ["string"], "description": "string"}],
  "missing_critical_skills": ["string"]
}"""


def resume_intelligence_node(state: CareerForgeState) -> dict:
    logger.info("[ResumeAgent] Parsing resume...")
    try:
        llm = ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=0.1,
            timeout=180,
            format="json",
        )
        prompt = (
            f"Target Role: {state.get('target_role', 'Software Engineer')}\n\n"
            f"Resume Text:\n{state.get('resume_text', '')[:6000]}"
        )
        response = llm.invoke([SystemMessage(content=SYSTEM), HumanMessage(content=prompt)])
        raw = response.content.strip()
        try:
            profile = json.loads(raw)
        except json.JSONDecodeError:
            # Strip markdown fences if model ignored format=json
            raw = re.sub(r"^```(?:json)?", "", raw, flags=re.MULTILINE).rstrip("` \n")
            try:
                profile = json.loads(raw)
            except json.JSONDecodeError:
                logger.error(f"[ResumeAgent] JSON parse failed. Raw: {raw[:200]}")
                profile = {}

        # Ensure all expected keys exist with correct types
        profile.setdefault("skills_explicit", [])
        profile.setdefault("skills_inferred", [])
        profile.setdefault("weaknesses", [])
        profile.setdefault("experience_level", "fresher")
        profile.setdefault("profile_summary", "")
        profile.setdefault("projects", [])
        profile.setdefault("missing_critical_skills", [])
        profile.setdefault("education", {})

        # FIX: Only return keys declared in CareerForgeState
        return {
            "resume_profile": profile,
            "completed_nodes": ["resume_agent"],
        }

    except Exception as e:
        logger.error(f"[ResumeAgent] Error: {e}")
        return {
            "resume_profile": {
                "skills_explicit": [],
                "skills_inferred": [],
                "weaknesses": ["Resume parsing failed — check that Ollama is running and model is pulled."],
                "experience_level": "unknown",
                "profile_summary": "Could not parse resume.",
                "projects": [],
                "missing_critical_skills": [],
                "education": {},
            },
            "errors": [f"ResumeAgent: {str(e)}"],
            "completed_nodes": ["resume_agent"],
        }
