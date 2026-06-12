"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import ReactMarkdown from "react-markdown";

export default function PreviewPage() {
  const [result, setResult] = useState<string | null>(null);
  const [template, setTemplate] = useState<"modern" | "classic" | "minimal">("modern");
  const [margin, setMargin] = useState<number>(20); // default 20mm
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("tailored_resume");
    if (!saved) {
      router.push("/");
    } else {
      setResult(saved);
    }
  }, [router]);

  const reactToPrintFn = useReactToPrint({ 
    contentRef,
    pageStyle: `@page { margin: ${margin}mm !important; }`,
  });

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-body)] p-4 md:p-8 flex flex-col items-center">
      
      {/* ── Settings Bar ── */}
      <div className="w-full max-w-4xl glass-card p-4 flex flex-wrap items-center gap-4 mb-8 justify-between sticky top-4 z-10">
        <button 
          onClick={() => router.push("/")}
          className="btn-secondary"
        >
          ← Back
        </button>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--text-secondary)] font-medium">Template:</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as any)}
              className="input-field py-1 px-3 min-h-[36px]"
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--text-secondary)] font-medium">Margin: {margin}mm</label>
            <input 
              type="range" 
              min="10" 
              max="40" 
              value={margin} 
              onChange={(e) => setMargin(parseInt(e.target.value))}
              className="w-24 accent-[var(--accent)]"
            />
          </div>

          <button 
            onClick={() => reactToPrintFn()}
            className="btn-primary"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Resume Preview ── */}
      <div className="w-full max-w-4xl bg-white shadow-xl overflow-hidden print:shadow-none mx-auto border border-gray-200">
        <div 
          ref={contentRef}
          className={`prose-resume template-${template}`}
          style={{ padding: `${margin}mm` }}
        >
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      </div>
    </main>
  );
}
