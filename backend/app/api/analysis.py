from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from app.db.database import get_db
from app.models.models import User, ResumeAnalysis, Roadmap
from app.schemas.schemas import AnalysisOut, WhatIfRequest, WhatIfOut, RoadmapOut
from app.api.auth import get_current_user
from app.services.analysis_service import extract_text, run_full_analysis, compute_what_if

router = APIRouter(prefix="/analysis", tags=["Analysis"])

MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


@router.post("/upload", response_model=AnalysisOut)
async def upload_and_analyze(
    resume: UploadFile = File(...),
    target_role: str = Form("Software Engineer"),
    github_username: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await resume.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")
    if not content:
        raise HTTPException(status_code=422, detail="Empty file uploaded")

    resume_text = extract_text(content, resume.filename or "resume.pdf")
    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text. Ensure the file is not scanned/image-only.")

    github = (github_username or current_user.github_username or "").strip()

    analysis = await run_full_analysis(
        db=db,
        user_id=current_user.id,
        resume_text=resume_text,
        github_username=github,
        target_role=target_role.strip() or "Software Engineer",
        job_description=job_description,
    )
    return AnalysisOut.model_validate(analysis)


@router.get("/history", response_model=list[AnalysisOut])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.user_id == current_user.id)
        .order_by(desc(ResumeAnalysis.created_at))
        .limit(20)
    )
    return [AnalysisOut.model_validate(a) for a in result.scalars().all()]


# FIX: /roadmap/latest MUST come BEFORE /{analysis_id} to avoid FastAPI
# treating "roadmap" as an analysis_id path parameter.
@router.get("/roadmap/latest", response_model=RoadmapOut)
async def get_latest_roadmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id)
        .order_by(desc(Roadmap.created_at))
        .limit(1)
    )
    roadmap = result.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(status_code=404, detail="No roadmap found — run a full analysis first")
    return RoadmapOut.model_validate(roadmap)


@router.post("/whatif", response_model=WhatIfOut)
async def what_if_simulation(
    payload: WhatIfRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not payload.scenarios:
        raise HTTPException(status_code=422, detail="At least one scenario is required")
    result = await compute_what_if(payload.analysis_id, payload.scenarios, db)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return WhatIfOut(**result)


# FIX: This wildcard route is LAST — after all specific routes
@router.get("/{analysis_id}", response_model=AnalysisOut)
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResumeAnalysis).where(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == current_user.id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return AnalysisOut.model_validate(analysis)
