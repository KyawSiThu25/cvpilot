# CVPilot — AI Resume Tailor & ATS Analyzer

CVPilot is an AI-powered web application that helps job seekers optimize their resumes for specific job postings. It uses open-source LLMs via the HuggingFace Inference API to generate ATS-friendly resumes and analyze keyword compatibility.

## Features

- **Resume Tailoring** — Input your profile and a job description; the AI generates an ATS-optimized resume in Markdown with targeted keywords, strong action verbs, and quantified achievements.
- **ATS Score Checker** — Paste any resume and job description to get a detailed compatibility analysis: overall score, category breakdowns (keyword match, formatting, relevance, skills, impact), matched/missing keywords, and actionable suggestions.
- **Structured Input** — Dynamic form with sections for personal info, skills, certifications, work experience, education (with GPA), and projects.
- **Markdown Preview** — Live-rendered resume output with professional styling.
- **Copy to Clipboard** — One-click copy of the raw Markdown output.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend | FastAPI, Uvicorn, Pydantic |
| AI | HuggingFace Inference API (`huggingface_hub`) |
| Model | Configurable — defaults to `Cannae-AI/Gemini-3.1-pro-Gemma-4-E4B-Distill-gguf` |

## Project Structure

```
cvpilot/
├── frontend/                   # Next.js frontend
│   ├── src/app/                # App router
│   │   ├── layout.tsx          # Root layout with Inter font + SEO
│   │   ├── globals.css         # Design system (dark mode, glassmorphism)
│   │   ├── page.tsx            # Resume tailor page
│   │   └── ats-score/
│   │       └── page.tsx        # ATS score checker page
│   └── package.json            # Node dependencies
│
├── backend/                    # FastAPI backend
│   ├── main.py                 # App entry point, CORS, health check
│   ├── check_token.py          # Utility script to test HF models
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment config (gitignored)
│   └── app/
│       ├── config.py           # Pydantic-settings (.env loader)
│       ├── schemas.py          # Request/response models
│       ├── prompts.py          # LLM system prompts
│       └── routes.py           # API endpoints
│
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- A **HuggingFace API token** — get one at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### 1. Clone & Install Frontend

```bash
git clone https://github.com/KyawSiThu25/cvpilot.git
cd cvpilot/frontend
npm install
```

### 2. Set Up Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure Environment

Create `backend/.env` (or edit the existing one):

```env
HF_API_TOKEN=hf_your_token_here
HF_MODEL_ID=Cannae-AI/Gemini-3.1-pro-Gemma-4-E4B-Distill-gguf
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
HOST=0.0.0.0
PORT=8000
```

### 4. Run Both Servers

```bash
# Terminal 1 — Backend
cd backend
python main.py
# → http://localhost:8000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:3000
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/tailor-resume` | Generate an ATS-optimized resume |
| `POST` | `/api/ats-score` | Analyze resume-to-JD compatibility |
| `GET` | `/docs` | Swagger UI (interactive API docs) |
| `GET` | `/redoc` | ReDoc (alternative API docs) |

### `POST /api/tailor-resume`

**Request body:**
```json
{
  "user_profile": {
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1 555-123-4567",
    "location": "San Francisco, CA",
    "summary": "Senior software engineer with 5 years...",
    "skills": ["Python", "React", "AWS"],
    "experience": [
      {
        "title": "Software Engineer",
        "company": "Acme Corp",
        "start_date": "Jan 2021",
        "end_date": "Present",
        "description": "Led development of..."
      }
    ],
    "education": [
      {
        "degree": "B.S. Computer Science",
        "institution": "MIT",
        "graduation_date": "2020",
        "gpa": "3.9/4.0"
      }
    ],
    "certifications": ["AWS Solutions Architect"],
    "projects": []
  },
  "job_description": "We are looking for a senior engineer..."
}
```

**Response:** Tailored resume in Markdown + model ID.

### `POST /api/ats-score`

**Request body:**
```json
{
  "resume_text": "# Jane Smith\n\n## Summary\n...",
  "job_description": "We are looking for a senior engineer..."
}
```

**Response:** Overall score (0–100), category breakdowns, matched/missing keywords, and suggestions.

## Switching Models

You can use any chat model available on the [HuggingFace Inference API](https://huggingface.co/docs/api-inference/). Update `HF_MODEL_ID` in `backend/.env`:

```env
# Confirmed working options:
HF_MODEL_ID=Cannae-AI/Gemini-3.1-pro-Gemma-4-E4B-Distill-gguf
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.2
HF_MODEL_ID=microsoft/Phi-3-mini-4k-instruct
HF_MODEL_ID=google/gemma-2-2b-it
```

> **Note:** Gated models (e.g. Meta Llama) require you to accept their license on HuggingFace before the API will serve them.

## License

MIT
