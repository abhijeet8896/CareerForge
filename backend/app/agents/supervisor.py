from app.agents.state import CareerForgeState
import logging, time

logger = logging.getLogger(__name__)


def supervisor_node(state: CareerForgeState) -> dict:
    """
    Master orchestrator.
    Validates input, sets defaults, initialises metadata.
    Never calls LLM — only routes and guards.
    """
    start = time.time()
    logger.info(f"[Supervisor] session={state.get('session_id')} user={state.get('user_id')}")

    updates: dict = {
        "completed_nodes": ["supervisor"],
        "errors": [],
    }

    resume_text = (state.get("resume_text") or "").strip()
    if not resume_text:
        updates["errors"] = ["No resume text found. Upload a readable PDF or DOCX."]
        logger.warning("[Supervisor] Empty resume text — aborting pipeline.")
        return updates

    if len(resume_text) < 100:
        updates["errors"] = ["Resume text too short — the file may be scanned/image-only."]
        return updates

    # Default target role
    if not (state.get("target_role") or "").strip():
        updates["target_role"] = "Software Engineer"
        logger.info("[Supervisor] target_role defaulted to 'Software Engineer'")

    # Clean github username
    github = (state.get("github_username") or "").strip().lstrip("@")
    if github != state.get("github_username", ""):
        updates["github_username"] = github

    elapsed = round((time.time() - start) * 1000)
    logger.info(f"[Supervisor] Validation passed in {elapsed}ms — routing to resume_agent")
    return updates


def route_after_supervisor(state: CareerForgeState) -> str:
    """Conditional edge: abort if supervisor flagged errors."""
    if state.get("errors"):
        return "end"
    return "resume_agent"
