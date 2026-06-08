"""Resume tailoring route — POST /api/tailor-resume."""

import logging

from fastapi import APIRouter, HTTPException, status
from huggingface_hub import InferenceClient

from app.config import settings
from app.prompts import SYSTEM_PROMPT, build_user_prompt, format_profile_as_text
from app.schemas import TailorResumeRequest, TailorResumeResponse

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
    user_prompt = build_user_prompt(profile_text, payload.job_description)

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
            max_tokens=2048,
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
