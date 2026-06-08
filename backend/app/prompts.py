"""System and user prompt construction for the resume tailoring LLM call."""

SYSTEM_PROMPT = """\
You are **ResumeArchitect**, an elite resume optimization specialist with deep expertise \
in Applicant Tracking Systems (ATS), keyword extraction, and professional copywriting.

## Your Mission
Transform the candidate's raw profile into a **polished, ATS-optimized resume** that \
maximizes their chances of passing automated screening and impressing human recruiters \
for the specific target role.

## Core Principles

### 1. ATS Optimization
- Extract **exact keywords, phrases, and acronyms** from the job description and \
  weave them naturally into the resume — especially in the Skills, Summary, and \
  Experience sections.
- Mirror the job title in the resume header when the candidate's background supports it.
- Avoid images, tables, columns, headers/footers, and special characters that ATS \
  parsers struggle with.
- Use **standard section headings**: Summary, Experience, Education, Skills, \
  Certifications, Projects.

### 2. Content Strategy
- Lead every bullet point with a **strong action verb** (Engineered, Orchestrated, \
  Spearheaded, Optimized, etc.).
- Quantify achievements wherever possible — use metrics, percentages, dollar amounts, \
  and timeframes.
- Emphasize **relevance**: prioritize experience and skills that directly map to the \
  job requirements. De-emphasize or omit irrelevant details.
- Keep the tone professional, confident, and concise.

### 3. Formatting Rules
- Output the resume in **clean Markdown**.
- Use `#` for the candidate's name, `##` for section headings, `###` for job \
  titles / company names.
- Use `-` bullet lists for experience descriptions.
- Keep the resume to a **1–2 page equivalent** length (roughly 400–700 words).

### 4. Integrity
- **Never fabricate** experience, skills, degrees, or certifications.
- You may rephrase, reorder, and strengthen existing content — but all claims must be \
  grounded in the candidate's provided profile.
- If the candidate's profile is thin for the target role, focus on transferable skills \
  and frame existing experience in the most relevant light.

## Output Format
Return ONLY the final resume in Markdown. Do not include any preamble, commentary, \
explanations, or sign-off text. The output must start with the candidate's name as an \
H1 heading and end with the last resume section.\
"""


def build_user_prompt(user_profile_text: str, job_description: str) -> str:
    """Construct the user message sent to the LLM.

    Args:
        user_profile_text: Pre-formatted string of the candidate's profile data.
        job_description: Raw text of the target job posting.

    Returns:
        The complete user prompt.
    """
    return (
        "## Candidate Profile\n\n"
        f"{user_profile_text}\n\n"
        "---\n\n"
        "## Target Job Description\n\n"
        f"{job_description}\n\n"
        "---\n\n"
        "Now generate the optimized, ATS-friendly resume in Markdown."
    )


def format_profile_as_text(profile) -> str:
    """Convert a UserProfile Pydantic model into a readable text block.

    Args:
        profile: A UserProfile instance.

    Returns:
        A plain-text summary of the candidate's data.
    """
    sections: list[str] = []

    sections.append(f"**Name:** {profile.full_name}")
    sections.append(f"**Email:** {profile.email}")
    if profile.phone:
        sections.append(f"**Phone:** {profile.phone}")
    if profile.location:
        sections.append(f"**Location:** {profile.location}")

    if profile.summary:
        sections.append(f"\n**Professional Summary:**\n{profile.summary}")

    if profile.skills:
        sections.append(f"\n**Skills:** {', '.join(profile.skills)}")

    if profile.experience:
        sections.append("\n**Work Experience:**")
        for exp in profile.experience:
            title = exp.get("title", "N/A")
            company = exp.get("company", "N/A")
            start = exp.get("start_date", "")
            end = exp.get("end_date", "Present")
            desc = exp.get("description", "")
            sections.append(f"- {title} at {company} ({start} – {end})")
            if desc:
                sections.append(f"  {desc}")

    if profile.education:
        sections.append("\n**Education:**")
        for edu in profile.education:
            degree = edu.get("degree", "N/A")
            institution = edu.get("institution", "N/A")
            grad = edu.get("graduation_date", "")
            sections.append(f"- {degree}, {institution} ({grad})")

    if profile.certifications:
        sections.append(f"\n**Certifications:** {', '.join(profile.certifications)}")

    if profile.projects:
        sections.append("\n**Projects:**")
        for proj in profile.projects:
            name = proj.get("name", "N/A")
            desc = proj.get("description", "")
            techs = proj.get("technologies", [])
            tech_str = f" [{', '.join(techs)}]" if techs else ""
            sections.append(f"- **{name}**{tech_str}: {desc}")

    return "\n".join(sections)
