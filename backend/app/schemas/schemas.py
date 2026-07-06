from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    github_username: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    github_username: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# FIX: Pydantic v2 — use Field(default_factory=) for mutable defaults
class AnalysisOut(BaseModel):
    id: str
    user_id: str
    skills_explicit: list = Field(default_factory=list)
    skills_inferred: list = Field(default_factory=list)
    weaknesses: list = Field(default_factory=list)
    profile_summary: Optional[str] = None
    experience_level: Optional[str] = None
    employability_score: float = 0.0
    score_breakdown: dict = Field(default_factory=dict)
    recommendations: list = Field(default_factory=list)
    github_analysis: dict = Field(default_factory=dict)
    recruiter_feedback: dict = Field(default_factory=dict)
    ats_report: dict = Field(default_factory=dict)
    market_data: dict = Field(default_factory=dict)
    roadmap_data: dict = Field(default_factory=dict)
    resume_profile: dict = Field(default_factory=dict)
    created_at: datetime

    model_config = {"from_attributes": True}


class WhatIfRequest(BaseModel):
    analysis_id: str
    scenarios: list[str] = Field(min_length=1)


class WhatIfOut(BaseModel):
    current_score: float
    scenarios: list[dict]


class RoadmapOut(BaseModel):
    id: str
    target_role: Optional[str] = None
    phases: dict = Field(default_factory=dict)
    current_phase: int = 1
    completion_percent: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}


class HealthOut(BaseModel):
    status: str
    app: str
    version: str = "1.0.0"
