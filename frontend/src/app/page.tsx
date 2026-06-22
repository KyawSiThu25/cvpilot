"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./components/LanguageContext";
import { setSessionItem, getSessionItem } from "./utils/session";

/* ────────────────────── Types ────────────────────── */

interface ExperienceEntry {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface EducationEntry {
  degree: string;
  institution: string;
  graduation_date: string;
  gpa: string;
}

interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
}

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string;
  certifications: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  job_description: string;
  profile_photo?: string;
}

const INITIAL_EXPERIENCE: ExperienceEntry = {
  title: "",
  company: "",
  start_date: "",
  end_date: "",
  description: "",
};

const INITIAL_EDUCATION: EducationEntry = {
  degree: "",
  institution: "",
  graduation_date: "",
  gpa: "",
};

const INITIAL_PROJECT: ProjectEntry = {
  name: "",
  description: "",
  technologies: [],
};

const INITIAL_FORM: FormState = {
  full_name: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  skills: "",
  certifications: "",
  experience: [{ ...INITIAL_EXPERIENCE }],
  education: [{ ...INITIAL_EDUCATION }],
  projects: [],
  job_description: "",
  profile_photo: "",
};

const API_URL = "http://localhost:8000/api/tailor-resume";

function formatFormToRawResume(form: FormState): string {
  const parts = [];
  if (form.full_name) parts.push(form.full_name);
  if (form.email || form.phone || form.location) {
    parts.push([form.email, form.phone, form.location].filter(Boolean).join(" | "));
  }
  if (form.summary) parts.push(`Summary:\n${form.summary}`);
  if (form.skills) parts.push(`Skills:\n${form.skills}`);
  if (form.certifications) parts.push(`Certifications:\n${form.certifications}`);
  
  const exps = form.experience.filter(e => e.title || e.company);
  if (exps.length > 0) {
    parts.push("Experience:\n" + exps.map(e => `${e.title} at ${e.company} (${e.start_date} - ${e.end_date})\n${e.description}`).join("\n\n"));
  }

  const edus = form.education.filter(e => e.degree || e.institution);
  if (edus.length > 0) {
    parts.push("Education:\n" + edus.map(e => `${e.degree} from ${e.institution} (${e.graduation_date}) - GPA: ${e.gpa}`).join("\n"));
  }

  const projs = form.projects.filter(p => p.name);
  if (projs.length > 0) {
    parts.push("Projects:\n" + projs.map(p => `${p.name} [${Array.isArray(p.technologies) ? p.technologies.join(", ") : p.technologies}]\n${p.description}`).join("\n\n"));
  }

  return parts.join("\n\n");
}

/* ────────────────────── Page Component ────────────────────── */

export default function Home() {
  const { language } = useLanguage();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [result, setResult] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /* ── Save to Session ── */
  useEffect(() => {
    const rawResume = formatFormToRawResume(form);
    if (rawResume.trim()) {
      setSessionItem("raw_resume", rawResume);
    }
    if (form.job_description.trim()) {
      setSessionItem("job_description", form.job_description);
    }
    if (form.profile_photo) {
      setSessionItem("profile_photo", form.profile_photo);
    }
  }, [form]);

  /* ── Load from Session ── */
  useEffect(() => {
    const savedJobDesc = getSessionItem("job_description");
    if (savedJobDesc) {
      setForm((prev) => ({ ...prev, job_description: savedJobDesc }));
    }
  }, []);

  /* ── Field updaters ── */

  const updateField = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateExperience = useCallback(
    (index: number, field: keyof ExperienceEntry, value: string) => {
      setForm((prev) => {
        const updated = [...prev.experience];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, experience: updated };
      });
    },
    []
  );

  const addExperience = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      experience: [...prev.experience, { ...INITIAL_EXPERIENCE }],
    }));
  }, []);

  const removeExperience = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  }, []);

  const updateEducation = useCallback(
    (index: number, field: keyof EducationEntry, value: string) => {
      setForm((prev) => {
        const updated = [...prev.education];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, education: updated };
      });
    },
    []
  );

  const addEducation = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      education: [...prev.education, { ...INITIAL_EDUCATION }],
    }));
  }, []);

  const removeEducation = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  }, []);

  const updateProject = useCallback(
    (index: number, field: keyof ProjectEntry, value: string | string[]) => {
      setForm((prev) => {
        const updated = [...prev.projects];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, projects: updated };
      });
    },
    []
  );

  const addProject = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      projects: [...prev.projects, { ...INITIAL_PROJECT }],
    }));
  }, []);

  const removeProject = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  }, []);

  /* ── Submit ── */

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      user_profile: {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        location: form.location || null,
        summary: form.summary || null,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        certifications: form.certifications
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience: form.experience.filter((e) => e.title || e.company),
        education: form.education.filter((e) => e.degree || e.institution),
        projects: form.projects
          .filter((p) => p.name)
          .map((p) => ({
            ...p,
            technologies:
              typeof p.technologies === "string"
                ? (p.technologies as unknown as string)
                  .split(",")
                  .map((t: string) => t.trim())
                  .filter(Boolean)
                : p.technologies,
          })),
      },
      job_description: form.job_description,
      language: language,
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.detail || `Server responded with ${res.status}`
        );
      }

      const data = await res.json();
      setSessionItem("tailored_resume", data.tailored_resume);
      router.push("/preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [form]);

  /* ── Validation ── */
  const isValid =
    form.full_name.trim() &&
    form.email.trim() &&
    form.job_description.trim().length >= 20;

  /* ────────────────────── Render ────────────────────── */

  return (
    <main className="relative z-10 min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div
          style={{
            maxWidth: "640px",
          }}
        >
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
            Craft the resume<br />
            <span style={{ fontStyle: "italic", color: "var(--accent-dark)" }}>
              they want to read.
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
            Paste your profile and target job description — the AI will craft an
            ATS-optimized resume tailored to land interviews.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-5">
          {/* Personal Info */}
          <section className="glass-card p-5">
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              {language === "my" ? "ကိုယ်ရေးအချက်အလက်" : "Personal Information"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="field-label">
                  {language === "my" ? "အမည်အပြည့်အစုံ *" : "Full Name *"}
                </label>
                <input
                  id="full_name"
                  type="text"
                  className="input-field"
                  placeholder={language === "my" ? "မောင်မောင်" : "Jane Smith"}
                  value={form.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="field-label">
                  {language === "my" ? "အီးမေးလ် *" : "Email *"}
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="phone" className="field-label">
                  {language === "my" ? "ဖုန်း" : "Phone"}
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="input-field"
                  placeholder="+1 (555) 123-4567"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="location" className="field-label">
                  {language === "my" ? "နေရပ်လိပ်စာ" : "Location"}
                </label>
                <input
                  id="location"
                  type="text"
                  className="input-field"
                  placeholder="San Francisco, CA"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="photo" className="field-label">
                  {language === "my" ? "ပရိုဖိုင် ဓာတ်ပုံ" : "Profile Photo"}
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="input-field bg-white"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateField("profile_photo", reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      updateField("profile_photo", "");
                    }
                  }}
                />
                {form.profile_photo && (
                  <div className="mt-2">
                    <img src={form.profile_photo} alt="Profile Preview" className="w-16 h-16 object-cover rounded-full border border-gray-300" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="summary" className="field-label">
                {language === "my" ? "အလုပ်အကိုင်အတွေ့အကြုံ အကျဉ်းချုပ်" : "Professional Summary"}
              </label>
              <textarea
                id="summary"
                className="input-field"
                rows={3}
                placeholder={language === "my" ? "သင်၏လုပ်ငန်းအတွေ့အကြုံနှင့် ရည်မှန်းချက် အကျဉ်းချုပ်..." : "Brief overview of your career, strengths, and goals…"}
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value)}
              />
            </div>
          </section>

          {/* Skills & Certs */}
          <section className="glass-card p-5">
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              {language === "my" ? "ကျွမ်းကျင်မှုနှင့် အသိအမှတ်ပြုလက်မှတ်များ" : "Skills & Certifications"}
            </h2>
            <div>
              <label htmlFor="skills" className="field-label">
                {language === "my" ? "ကျွမ်းကျင်မှုများ (ကော်မာဖြင့်ခြားပါ)" : "Skills (comma-separated)"}
              </label>
              <input
                id="skills"
                type="text"
                className="input-field"
                placeholder="React, Python, AWS, CI/CD, Agile…"
                value={form.skills}
                onChange={(e) => updateField("skills", e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label htmlFor="certifications" className="field-label">
                {language === "my" ? "အသိအမှတ်ပြုလက်မှတ်များ (ကော်မာဖြင့်ခြားပါ)" : "Certifications (comma-separated)"}
              </label>
              <input
                id="certifications"
                type="text"
                className="input-field"
                placeholder="AWS Solutions Architect, PMP…"
                value={form.certifications}
                onChange={(e) => updateField("certifications", e.target.value)}
              />
            </div>
          </section>

          {/* Experience */}
          <section className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.25rem",
                  color: "var(--text-primary)",
                }}
              >
                {language === "my" ? "လုပ်ငန်းအတွေ့အကြုံ" : "Work Experience"}
              </h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={addExperience}
              >
                {language === "my" ? "+ ထည့်မည်" : "+ Add"}
              </button>
            </div>

            <div className="space-y-4">
              {form.experience.map((exp, i) => (
                <div key={i} className="experience-row space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {language === "my" ? `ရာထူး ${i + 1}` : `Position ${i + 1}`}
                    </span>
                    {form.experience.length > 1 && (
                      <button
                        type="button"
                        style={{
                          color: "var(--error)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          padding: "4px 8px",
                        }}
                        onClick={() => removeExperience(i)}
                        title={language === "my" ? "ဖယ်ရှားမည်" : "Remove"}
                      >
                        {language === "my" ? "ဖယ်ရှားမည်" : "Remove"}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "ရာထူးအမည်" : "Job Title"}
                      value={exp.title}
                      onChange={(e) =>
                        updateExperience(i, "title", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "ကုမ္ပဏီ" : "Company"}
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(i, "company", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "စတင်သည့်ရက်စွဲ" : "Start Date (e.g. Jan 2022)"}
                      value={exp.start_date}
                      onChange={(e) =>
                        updateExperience(i, "start_date", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "ပြီးဆုံးသည့်ရက်စွဲ" : "End Date (or Present)"}
                      value={exp.end_date}
                      onChange={(e) =>
                        updateExperience(i, "end_date", e.target.value)
                      }
                    />
                  </div>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder={language === "my" ? "တာဝန်များနှင့် အောင်မြင်မှုများ..." : "Key responsibilities and achievements…"}
                    value={exp.description}
                    onChange={(e) =>
                      updateExperience(i, "description", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.25rem",
                  color: "var(--text-primary)",
                }}
              >
                {language === "my" ? "ပညာအရည်အချင်း" : "Education"}
              </h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={addEducation}
              >
                {language === "my" ? "+ ထည့်မည်" : "+ Add"}
              </button>
            </div>

            <div className="space-y-4">
              {form.education.map((edu, i) => (
                <div key={i} className="experience-row space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {language === "my" ? `ပညာအရည်အချင်း ${i + 1}` : `Education ${i + 1}`}
                    </span>
                    {form.education.length > 1 && (
                      <button
                        type="button"
                        style={{
                          color: "var(--error)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          padding: "4px 8px",
                        }}
                        onClick={() => removeEducation(i)}
                        title={language === "my" ? "ဖယ်ရှားမည်" : "Remove"}
                      >
                        {language === "my" ? "ဖယ်ရှားမည်" : "Remove"}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "ဘွဲ့" : "Degree"}
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(i, "degree", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "ကျောင်း/တက္ကသိုလ်" : "Institution"}
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducation(i, "institution", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "ဘွဲ့ရသည့်နှစ်" : "Graduation Date"}
                      value={edu.graduation_date}
                      onChange={(e) =>
                        updateEducation(i, "graduation_date", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "GPA" : "GPA (e.g. 3.8/4.0)"}
                      value={edu.gpa}
                      onChange={(e) =>
                        updateEducation(i, "gpa", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.25rem",
                  color: "var(--text-primary)",
                }}
              >
                {language === "my" ? "ပရောဂျက်များ" : "Projects"}
              </h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={addProject}
              >
                {language === "my" ? "+ ထည့်မည်" : "+ Add"}
              </button>
            </div>

            {form.projects.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                No projects added yet. Click &quot;{language === "my" ? "+ ထည့်မည်" : "+ Add"}&quot; to include one.
              </p>
            )}

            <div className="space-y-4">
              {form.projects.map((proj, i) => (
                <div key={i} className="experience-row space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {language === "my" ? `ပရောဂျက် ${i + 1}` : `Project ${i + 1}`}
                    </span>
                    <button
                      type="button"
                      style={{
                        color: "var(--error)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        padding: "4px 8px",
                      }}
                      onClick={() => removeProject(i)}
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "ပရောဂျက် အမည်" : "Project Name"}
                      value={proj.name}
                      onChange={(e) =>
                        updateProject(i, "name", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === "my" ? "နည်းပညာများ (ကော်မာဖြင့်ခြားပါ)" : "Technologies (comma-separated)"}
                      value={
                        Array.isArray(proj.technologies)
                          ? proj.technologies.join(", ")
                          : proj.technologies
                      }
                      onChange={(e) =>
                        updateProject(i, "technologies", e.target.value as unknown as string[])
                      }
                    />
                  </div>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder={language === "my" ? "ပရောဂျက်အကြောင်း၊ သင့်အခန်းကဏ္ဍ၊ သက်ရောက်မှု..." : "What the project does, your role, impact…"}
                    value={proj.description}
                    onChange={(e) =>
                      updateProject(i, "description", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Job Description */}
          <section className="glass-card p-5">
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              {language === "my" ? "လျှောက်ထားမည့် အလုပ်အကိုင်ဖော်ပြချက်" : "Target Job Description"} <span style={{ color: "var(--error)" }}>*</span>
            </h2>
            <textarea
              id="job_description"
              className="input-field"
              rows={8}
              placeholder={language === "my" ? "အလုပ်ခေါ်စာကို ဤနေရာတွင် paste လုပ်ပါ..." : "Paste the full job posting here — the AI will extract keywords and optimize your resume to match…"}
              value={form.job_description}
              onChange={(e) => updateField("job_description", e.target.value)}
            />
            <p
              style={{
                marginTop: "8px",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              {language === "my" ? "အနည်းဆုံး အက္ခရာ ၂၀ ရှိရမည်။" : "Minimum 20 characters. The more detail you paste, the better the tailoring."}
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
                {language === "my" ? "ဖန်တီးနေပါသည်..." : "Generating…"}
              </>
            ) : (
              language === "my" ? "ကိုယ်ရေးမှတ်တမ်းကို ပြင်ဆင်မည် →" : "Tailor My Resume →"
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 glass-card" style={{ borderColor: 'var(--error)' }}>
              <div className="status-badge error" style={{ marginBottom: "12px" }}>Error</div>
              <p style={{ fontSize: "0.85rem", color: "var(--error)" }}>
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}