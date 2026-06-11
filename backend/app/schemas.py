"""Pydantic models for request/response validation."""

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """Structured representation of the user's resume data."""

    full_name: str = Field(..., min_length=1, description="Full legal name")
    email: str = Field(..., description="Contact email")
    phone: str | None = Field(None, description="Phone number")
    location: str | None = Field(None, description="City, State or Country")
    summary: str | None = Field(None, description="Professional summary / objective")
    skills: list[str] = Field(default_factory=list, description="Technical and soft skills")
    experience: list[dict] = Field(
        default_factory=list,
        description=(
            "Work experience entries. Each dict should contain keys like "
            "'title', 'company', 'start_date', 'end_date', 'description'."
        ),
    )
    education: list[dict] = Field(
        default_factory=list,
        description=(
            "Education entries. Each dict should contain keys like "
            "'degree', 'institution', 'graduation_date', 'gpa'."
        ),
    )
    certifications: list[str] = Field(
        default_factory=list,
        description="Professional certifications",
    )
    projects: list[dict] = Field(
        default_factory=list,
        description="Notable projects with 'name', 'description', 'technologies'.",
    )


class TailorResumeRequest(BaseModel):
    """Incoming payload for the /api/tailor-resume endpoint."""

    user_profile: UserProfile
    job_description: str = Field(
        ...,
        min_length=20,
        description="Full text of the target job posting",
    )
    language: str = Field(
        default="en",
        description="Language to use for the response (e.g., 'en' or 'my')",
    )


class TailorResumeResponse(BaseModel):
    """Response payload containing the tailored resume."""

    tailored_resume: str = Field(
        ..., description="ATS-optimized resume formatted in Markdown"
    )
    model_used: str = Field(..., description="HuggingFace model ID that was used")


# ── ATS Score ──────────────────────────────────────────────────────


class ATSScoreRequest(BaseModel):
    """Incoming payload for the /api/ats-score endpoint."""

    resume_text: str = Field(
        ...,
        min_length=20,
        description="Full resume text (plain text or Markdown)",
    )
    job_description: str = Field(
        ...,
        min_length=20,
        description="Full text of the target job posting",
    )
    language: str = Field(
        default="en",
        description="Language to use for the response (e.g., 'en' or 'my')",
    )


class CategoryScore(BaseModel):
    """Score for an individual ATS evaluation category."""

    name: str = Field(..., description="Category name")
    score: int = Field(..., ge=0, le=100, description="Score out of 100")
    feedback: str = Field(..., description="Brief feedback for this category")


class ATSScoreResponse(BaseModel):
    """Response payload containing the ATS compatibility analysis."""

    overall_score: int = Field(..., ge=0, le=100, description="Overall ATS score 0-100")
    categories: list[CategoryScore] = Field(
        ..., description="Breakdown by evaluation category"
    )
    matched_keywords: list[str] = Field(
        default_factory=list, description="Keywords found in both resume and JD"
    )
    missing_keywords: list[str] = Field(
        default_factory=list, description="Important JD keywords missing from resume"
    )
    suggestions: list[str] = Field(
        default_factory=list, description="Actionable improvement tips"
    )
    model_used: str = Field(..., description="HuggingFace model ID that was used")

