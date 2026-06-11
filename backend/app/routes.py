"""Resume tailoring and ATS scoring routes."""

import json
import logging
import re

from fastapi import APIRouter, HTTPException, status
from huggingface_hub import InferenceClient

from app.config import settings
from app.prompts import (
    ATS_SCORE_SYSTEM_PROMPT,
    SYSTEM_PROMPT,
    build_ats_score_prompt,
    build_user_prompt,
    format_profile_as_text,
)
from app.schemas import (
    ATSScoreRequest,
    ATSScoreResponse,
    TailorResumeRequest,
    TailorResumeResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Resume"])

# Initialise the HF Inference Client once at module level
_client = InferenceClient(token=settings.hf_api_token)


@router.post(
    "/tailor-resume",
    response_model=TailorResumeResponse,
    status_code=status.HTTP_200_OK,
    summary="Tailor a resume for a specific job description",
    description=(
        "Accepts a structured user profile and a job description, then uses an "
        "instruction-tuned LLM to produce an ATS-optimized resume in Markdown."
    ),
)
async def tailor_resume(payload: TailorResumeRequest) -> TailorResumeResponse:
    """Generate a tailored, ATS-optimized resume.

    The heavy lifting is offloaded to the HuggingFace Inference API so this
    endpoint stays non-blocking despite the synchronous SDK call (FastAPI runs
    sync route handlers in a threadpool automatically when needed; we mark
    it async and use the client directly since the HF Inference API call is
    I/O-bound and the client handles it).
    """
    profile_text = format_profile_as_text(payload.user_profile)
    user_prompt = build_user_prompt(profile_text, payload.job_description, payload.language)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    model_id = settings.hf_model_id

    try:
        logger.info("Calling HF Inference API with model=%s", model_id)

        response = _client.chat_completion(
            model=model_id,
            messages=messages,
            max_tokens=8192,
            temperature=0.5,
            top_p=0.9,
        )

        tailored_text = response.choices[0].message.content

        if not tailored_text or not tailored_text.strip():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The model returned an empty response. Please try again.",
            )

        logger.info("Successfully generated tailored resume (%d chars)", len(tailored_text))

        return TailorResumeResponse(
            tailored_resume=tailored_text.strip(),
            model_used=model_id,
        )

    except HTTPException:
        raise  # Re-raise our own HTTP exceptions
    except Exception as exc:
        logger.exception("HuggingFace Inference API call failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate tailored resume: {exc}",
        ) from exc


# ── ATS Score ──────────────────────────────────────────────────────


def _extract_json(text: str) -> dict:
    """Extract a JSON object from LLM output that may contain markdown fencing."""
    # Try direct parse first
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try to find the first { ... } block
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not extract valid JSON from model response")


@router.post(
    "/ats-score",
    response_model=ATSScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze ATS compatibility score",
    tags=["ATS"],
    description=(
        "Accepts a resume and a job description, then uses an instruction-tuned "
        "LLM to evaluate ATS compatibility and return a detailed score breakdown."
    ),
)
async def ats_score(payload: ATSScoreRequest) -> ATSScoreResponse:
    """Evaluate how well a resume matches a job description for ATS systems."""
    user_prompt = build_ats_score_prompt(payload.resume_text, payload.job_description, payload.language)

    messages = [
        {"role": "system", "content": ATS_SCORE_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    model_id = settings.hf_model_id

    try:
        logger.info("Calling HF Inference API for ATS score with model=%s", model_id)

        response = _client.chat_completion(
            model=model_id,
            messages=messages,
            max_tokens=8192,
            temperature=0.3,
            top_p=0.9,
        )

        raw_text = response.choices[0].message.content

        if not raw_text or not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The model returned an empty response. Please try again.",
            )

        data = _extract_json(raw_text)

        logger.info("ATS score analysis complete — overall_score=%s", data.get("overall_score"))

        return ATSScoreResponse(
            overall_score=data["overall_score"],
            categories=data.get("categories", []),
            matched_keywords=data.get("matched_keywords", []),
            missing_keywords=data.get("missing_keywords", []),
            suggestions=data.get("suggestions", []),
            model_used=model_id,
        )

    except HTTPException:
        raise
    except ValueError as exc:
        logger.exception("Failed to parse ATS score JSON from model response")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Model returned invalid JSON: {exc}",
        ) from exc
    except Exception as exc:
        logger.exception("HuggingFace Inference API call failed for ATS score")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate ATS score: {exc}",
        ) from exc

