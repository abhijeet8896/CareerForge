import uuid, io, logging, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.agents.graph import get_graph
from app.agents.state import CareerForgeState
from app.models.models import ResumeAnalysis, Roadmap, CareerHistory
import PyPDF2
import docx

logger = logging.getLogger(__name__)


def extract_text(content: bytes, filename: str) -> str:
    """Extract plain text from PDF, DOCX, or raw UTF-8 bytes."""
    fname = (filename or "").lower().strip()
    try:
        if fname.endswith(".pdf"):
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            pages  = [page.extract_text() or "" for page in reader.pages]
            text   = "\n".join(pages).strip()
            if not text:
                logger.warning("PDF produced no text — may be scanned/image-only")
            return text
        elif fname.endswith(".docx"):
            doc  = docx.Document(io.BytesIO(content))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            return text
        else:
            return content.decode("utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"extract_text failed for '{filename}': {e}")
        return ""


async def run_full_analysis(
    db: AsyncSession,
    user_id: str,
    resume_text: str,
    github_username: str | None,
    target_role: str,
    job_description: str | None,
) -> ResumeAnalysis:

    session_id = str(uuid.uuid4())
    t0 = time.time()
    logger.info(f"[Pipeline] START session={session_id} user={user_id} role='{target_role}'")

    # Strict CareerForgeState — only declared keys
    initial: CareerForgeState = {
        "user_id":         user_id,
        "session_id":      session_id,
        "resume_text":     resume_text,
        "github_username": (github_username or "").strip(),
        "target_role":     (target_role or "Software Engineer").strip(),
        "job_description": (job_description or "").strip(),
        # Agent outputs — all empty at start
        "resume_profile":         {},
        "github_analysis":        {},
        "recruiter_feedback":     {},
        "ats_report":             {},
        "market_data":            {},
        "project_recommendations": [],
        "roadmap":                {},
        "employability_score":    0.0,
        "score_breakdown":        {},
        # Reducers
        "errors":          [],
        "completed_nodes": [],
    }

    graph  = get_graph()
    result = graph.invoke(initial)

    elapsed = round(time.time() - t0, 1)
    completed = result.get("completed_nodes", [])
    errors    = result.get("errors", [])
    logger.info(f"[Pipeline] DONE in {elapsed}s | nodes={completed} | errors={errors}")

    profile = result.get("resume_profile") or {}

    # Persist main analysis
    analysis = ResumeAnalysis(
        user_id          = user_id,
        raw_text         = resume_text[:8000],
        resume_profile   = profile,
        skills_explicit  = profile.get("skills_explicit", []),
        skills_inferred  = profile.get("skills_inferred", []),
        weaknesses       = profile.get("weaknesses", []),
        profile_summary  = profile.get("profile_summary"),
        experience_level = profile.get("experience_level"),
        employability_score = result.get("employability_score", 0.0),
        score_breakdown  = result.get("score_breakdown", {}),
        recommendations  = result.get("project_recommendations", []),
        github_analysis  = result.get("github_analysis", {}),
        recruiter_feedback = result.get("recruiter_feedback", {}),
        ats_report       = result.get("ats_report", {}),
        market_data      = result.get("market_data", {}),
        roadmap_data     = result.get("roadmap", {}),
    )
    db.add(analysis)
    await db.flush()  # materialise analysis.id for FK

    # Persist roadmap
    roadmap_phases = result.get("roadmap") or {}
    if roadmap_phases:
        roadmap = Roadmap(
            user_id     = user_id,
            analysis_id = analysis.id,
            target_role = target_role,
            phases      = roadmap_phases,
        )
        db.add(roadmap)

    # Persist event history
    db.add(CareerHistory(
        user_id    = user_id,
        event_type = "full_analysis",
        event_data = {
            "session_id":      session_id,
            "completed_nodes": completed,
            "errors":          errors,
            "duration_s":      elapsed,
        },
        employability_score = result.get("employability_score", 0.0),
    ))

    await db.commit()
    await db.refresh(analysis)
    return analysis


async def compute_what_if(analysis_id: str, scenarios: list[str], db: AsyncSession) -> dict:
    row = await db.execute(
        select(ResumeAnalysis).where(ResumeAnalysis.id == analysis_id)
    )
    analysis = row.scalar_one_or_none()
    if not analysis:
        return {}

    current = analysis.employability_score

    # Keyword-to-delta map (points per keyword match, capped at 15)
    DELTAS: dict[str, float] = {
        "react": 7,       "vue": 5,       "angular": 5,
        "typescript": 6,  "javascript": 4,
        "docker": 6,      "kubernetes": 7,
        "aws": 8,         "gcp": 7,       "azure": 7,
        "project": 5,     "portfolio": 6,
        "ats": 4,         "optimise": 4,  "optimize": 4,
        "github": 4,      "open source": 6,
        "dsa": 5,         "leetcode": 5,  "algorithm": 4,
        "certification": 7,
        "sql": 4,         "postgresql": 5, "mongodb": 4,
        "system design": 8,
        "testing": 4,     "jest": 3,      "pytest": 3,
        "python": 4,      "fastapi": 5,   "django": 4,
        "node": 4,        "nextjs": 6,    "tailwind": 3,
        "machine learning": 8, "ml": 6,   "ai": 6,
        "ci/cd": 6,       "devops": 7,    "linux": 4,
    }

    results: list[dict] = []
    cumulative = current
    for scenario in scenarios:
        s = scenario.lower()
        delta = sum(v for k, v in DELTAS.items() if k in s)
        delta = round(min(max(delta, 2.0), 15.0), 1)
        cumulative = round(min(cumulative + delta, 100.0), 1)
        results.append({
            "scenario":        scenario,
            "score_delta":     delta,
            "projected_score": cumulative,
            "rationale":       f"'{scenario}' closes a key skill gap identified in your profile.",
        })

    return {"current_score": current, "scenarios": results}
