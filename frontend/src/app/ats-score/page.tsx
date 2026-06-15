"use client";

import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "../components/LanguageContext";
import { getSessionItem } from "../utils/session";

/* ────────────────────── Types ────────────────────── */

interface CategoryScore {
  name: string;
  score: number;
  feedback: string;
}

interface ATSResult {
  overall_score: number;
  categories: CategoryScore[];
  matched_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
  model_used: string;
}

const API_URL = "/api/ats-score";

/* ────────────────────── Helpers ────────────────────── */

function getScoreColor(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "#9A8A3C";
  if (score >= 40) return "#B07940";
  return "var(--error)";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

/* ────────────────────── Score Ring Component ────────────────────── */

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          style={{
            transition: "stroke-dashoffset 0.8s ease-out, stroke 0.3s",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "2.5rem",
            color,
            transition: "color 0.3s",
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
          }}
        >
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

/* ────────────────────── Category Bar Component ────────────────────── */

function CategoryBar({ category }: { category: CategoryScore }) {
  const color = getScoreColor(category.score);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          {category.name}
        </span>
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color,
          }}
        >
          {category.score}%
        </span>
      </div>
      <div
        style={{
          height: "6px",
          background: "var(--bg-input)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${category.score}%`,
            background: color,
            borderRadius: "2px",
            transition: "width 0.8s ease-out",
          }}
        />
      </div>
      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          lineHeight: "1.5",
        }}
      >
        {category.feedback}
      </p>
    </div>
  );
}

/* ────────────────────── Page Component ────────────────────── */

export default function ATSScorePage() {
  const { language } = useLanguage();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedJobDesc = getSessionItem("job_description");
    if (savedJobDesc) {
      setJobDescription(savedJobDesc);
    }

    const savedTailored = getSessionItem("tailored_resume");
    const savedRaw = getSessionItem("raw_resume");
    
    if (savedTailored) {
      setResumeText(savedTailored);
    } else if (savedRaw) {
      setResumeText(savedRaw);
    }
  }, []);

  // Save changes back to session storage
  useEffect(() => {
    if (jobDescription.trim()) {
      import("../utils/session").then(({ setSessionItem }) => {
        setSessionItem("job_description", jobDescription);
      });
    }
  }, [jobDescription]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
          language: language,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Server responded with ${res.status}`);
      }

      const data: ATSResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [resumeText, jobDescription]);

  const isValid = resumeText.trim().length >= 20 && jobDescription.trim().length >= 20;

  return (
    <main className="relative z-10 min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div style={{ maxWidth: "640px" }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              marginBottom: "8px",
            }}
          >
            ATS Compatibility Analyzer
          </p>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              color: "var(--text-primary)",
              marginBottom: "12px",
              lineHeight: "1.05",
            }}
          >
            See how you<br />
            <span style={{ fontStyle: "italic", color: "var(--accent-dark)" }}>
              measure up.
            </span>
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              lineHeight: "1.7",
              maxWidth: "480px",
            }}
          >
            Paste your resume and a job description to see how well they match.
            Get a detailed breakdown with keyword analysis and actionable suggestions.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
        {/* ═══════════ LEFT — Inputs ═══════════ */}
        <div className="space-y-5">
          {/* Resume Input */}
          <section className="glass-card p-5">
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              {language === "my" ? "သင့် ကိုယ်ရေးမှတ်တမ်း" : "Your Resume"}
            </h2>
            <textarea
              id="resume_text"
              className="input-field"
              rows={12}
              placeholder={language === "my" ? "သင့်ကိုယ်ရေးမှတ်တမ်းအပြည့်အစုံကို ဤနေရာတွင် paste လုပ်ပါ..." : "Paste your full resume text here (plain text or Markdown)…"}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <p
              style={{
                marginTop: "8px",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              {resumeText.length} {language === "my" ? "အက္ခရာများ · အနည်းဆုံး ၂၀ ရှိရမည်" : "characters · Minimum 20 required"}
            </p>
          </section>

          {/* Job Description Input */}
          <section className="glass-card p-5">
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              {language === "my" ? "လျှောက်ထားမည့် အလုပ်အကိုင်ဖော်ပြချက်" : "Target Job Description"}
            </h2>
            <textarea
              id="job_description_ats"
              className="input-field"
              rows={10}
              placeholder={language === "my" ? "အလုပ်ခေါ်စာအပြည့်အစုံကို ဤနေရာတွင် paste လုပ်ပါ..." : "Paste the full job posting here…"}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <p
              style={{
                marginTop: "8px",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              {jobDescription.length} {language === "my" ? "အက္ခရာများ · အနည်းဆုံး ၂၀ ရှိရမည်" : "characters · Minimum 20 required"}
            </p>
          </section>

          {/* Submit */}
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!isValid || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <span className="spinner" />
                {language === "my" ? "ဆန်းစစ်နေပါသည်..." : "Analyzing…"}
              </>
            ) : (
              language === "my" ? "ATS အမှတ်ကို စစ်ဆေးမည် →" : "Check ATS Score →"
            )}
          </button>
        </div>

        {/* ═══════════ RIGHT — Results ═══════════ */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="glass-card p-6 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.25rem",
                  color: "var(--text-primary)",
                }}
              >
                {language === "my" ? "ဆန်းစစ်မှုရလဒ်များ" : "Analysis Results"}
              </h2>
              {result && (
                <span className="status-badge success">
                  <span className="pulse-dot" />
                  {result.model_used.split("/").pop()}
                </span>
              )}
            </div>

            <div className="section-divider" />

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="spinner" style={{ width: 28, height: 28 }} />
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {language === "my" ? "ATS ကိုက်ညီမှုကို ဆန်းစစ်နေပါသည်..." : "Analyzing ATS compatibility…"}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div>
                <div className="status-badge error" style={{ marginBottom: "12px" }}>
                  {language === "my" ? "အမှားအယွင်း" : "Error"}
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--error)" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    border: "2px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    color: "var(--text-muted)",
                  }}
                >
                  %
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    maxWidth: "260px",
                    lineHeight: "1.6",
                  }}
                >
                  {language === "my" ? "ကိုယ်ရေးမှတ်တမ်းနှင့် အလုပ်ခေါ်စာကို paste လုပ်ပြီးနောက် ခွဲခြမ်းစိတ်ဖြာမှုရယူရန် " : "Paste your resume and a job description, then hit "}
                  <strong style={{ color: "var(--text-secondary)" }}>
                    {language === "my" ? "ATS အမှတ်ကို စစ်ဆေးမည်" : "Check ATS Score"}
                  </strong>{" "}
                  {language === "my" ? " ကိုနှိပ်ပါ။" : "to get your analysis."}
                </p>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="space-y-6 flex-1">
                {/* Overall Score Ring */}
                <div className="flex justify-center py-4">
                  <ScoreRing score={result.overall_score} />
                </div>

                {/* Category Breakdown */}
                <div className="space-y-4">
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.1rem",
                      fontStyle: "italic",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {language === "my" ? "ကဏ္ဍအလိုက် အသေးစိတ်" : "Category Breakdown"}
                  </h3>
                  {result.categories.map((cat, i) => (
                    <CategoryBar key={i} category={cat} />
                  ))}
                </div>

                <div className="section-divider" />

                {/* Keywords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Matched */}
                  <div>
                    <h3
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--success)",
                        marginBottom: "12px",
                      }}
                    >
                      {language === "my" ? "✓ တူညီသောသော့ချက်စာလုံးများ" : "✓ Matched Keywords"}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matched_keywords.map((kw, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            background: "rgba(107, 122, 94, 0.1)",
                            color: "var(--success)",
                            border: "1px solid rgba(107, 122, 94, 0.25)",
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                      {result.matched_keywords.length === 0 && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {language === "my" ? "မတွေ့ရှိပါ" : "None found"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Missing */}
                  <div>
                    <h3
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--error)",
                        marginBottom: "12px",
                      }}
                    >
                      {language === "my" ? "✕ လိုအပ်နေသော သော့ချက်စာလုံးများ" : "✕ Missing Keywords"}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing_keywords.map((kw, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            background: "rgba(163, 81, 66, 0.08)",
                            color: "var(--error)",
                            border: "1px solid rgba(163, 81, 66, 0.2)",
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                      {result.missing_keywords.length === 0 && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {language === "my" ? "မရှိပါ — အလွန်ကောင်းမွန်ပါသည်!" : "None — great coverage!"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="section-divider" />

                {/* Suggestions */}
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.1rem",
                      fontStyle: "italic",
                      color: "var(--text-secondary)",
                      marginBottom: "12px",
                    }}
                  >
                    {language === "my" ? "အကြံပြုချက်များ" : "Suggestions"}
                  </h3>
                  <ul className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3"
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                          lineHeight: "1.6",
                        }}
                      >
                        <span
                          style={{
                            marginTop: "2px",
                            flexShrink: 0,
                            width: "22px",
                            height: "22px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            border: "2px solid var(--border-subtle)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
