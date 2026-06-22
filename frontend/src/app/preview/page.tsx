"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import ReactMarkdown from "react-markdown";
import { getSessionItem } from "../utils/session";

export default function PreviewPage() {
  const [result, setResult] = useState<string | null>(null);
  const [template, setTemplate] = useState<"modern" | "two-column-dark" | "minimalist">("modern");
  const [margin, setMargin] = useState<number>(20); // default 20mm
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = getSessionItem("tailored_resume");
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
              <option value="modern">Modern (Default)</option>
              <option value="two-column-dark">Creative Dark</option>
              <option value="minimalist">Minimalist</option>
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
          className={template === "modern" ? "prose-resume template-modern" : ""}
          style={template === "modern" ? { padding: `${margin}mm` } : {}}
        >
          {template === "modern" && <ReactMarkdown>{result}</ReactMarkdown>}
          {template === "two-column-dark" && <TwoColumnDarkTemplate result={result} margin={margin} />}
          {template === "minimalist" && <MinimalistTemplate result={result} margin={margin} />}
        </div>
      </div>
    </main>
  );
}

// ── Custom Renderers ──

function parseResumeMarkdown(markdown: string) {
  const lines = markdown.split('\n');
  let name = "";
  let contactLines: string[] = [];
  const sections: { title: string; content: string }[] = [];
  
  let currentSectionTitle = "";
  let currentSectionContent: string[] = [];

  let preSection = true;

  for (const line of lines) {
    if (line.startsWith('# ') && preSection) {
      name = line.replace('# ', '').trim();
    } else if (line.startsWith('## ')) {
      if (currentSectionTitle) {
        sections.push({ title: currentSectionTitle, content: currentSectionContent.join('\n').trim() });
      } else if (preSection && currentSectionContent.length > 0) {
        contactLines = currentSectionContent.filter(l => l.trim().length > 0 && !l.startsWith('# '));
      }
      preSection = false;
      currentSectionTitle = line.replace('## ', '').trim();
      currentSectionContent = [];
    } else {
      currentSectionContent.push(line);
    }
  }

  if (currentSectionTitle) {
    sections.push({ title: currentSectionTitle, content: currentSectionContent.join('\n').trim() });
  } else if (preSection && currentSectionContent.length > 0) {
    contactLines = currentSectionContent.filter(l => l.trim().length > 0 && !l.startsWith('# '));
  }

  contactLines = contactLines.flatMap(line => line.split('|').map(s => s.trim())).filter(Boolean);

  return { name, contactLines, sections };
}

const TwoColumnDarkTemplate = ({ result, margin }: { result: string, margin: number }) => {
  const { name, contactLines, sections } = parseResumeMarkdown(result);
  const leftKeywords = ['skill', 'cert', 'hobb', 'contact', 'language'];
  const leftSections = sections.filter(s => leftKeywords.some(k => s.title.toLowerCase().includes(k)));
  const rightSections = sections.filter(s => !leftKeywords.some(k => s.title.toLowerCase().includes(k)));

  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const restName = nameParts.slice(1).join(' ');

  return (
    <div className="flex bg-white text-left font-sans" style={{ minHeight: '100%', padding: `${margin}mm`, boxSizing: 'border-box' }}>
      <div className="w-1/3 bg-[#3d3835] text-white p-6 rounded-l-lg">
         <div className="w-32 h-32 bg-[#E58F40] rounded-3xl mx-auto mb-8 border-4 border-[#3d3835] shadow-lg overflow-hidden flex items-center justify-center">
            <span className="text-5xl text-white font-bold">{firstName[0]}</span>
         </div>
         
         <div className="mb-8">
           <h2 className="text-[#E58F40] text-lg font-bold uppercase mb-4 tracking-widest flex items-center gap-2">
              <span className="bg-[#E58F40] text-[#3d3835] rounded-full w-6 h-6 flex items-center justify-center text-sm">👤</span>
              Contact
           </h2>
           <div className="text-sm space-y-2 text-gray-300 break-words [&_p]:m-0">
             {contactLines.map((line, i) => (
               <ReactMarkdown key={i}>{line}</ReactMarkdown>
             ))}
           </div>
         </div>

         {leftSections.map(sec => (
           <div key={sec.title} className="mb-8">
             <h2 className="text-[#E58F40] text-lg font-bold uppercase mb-4 tracking-widest flex items-center gap-2">
               <span className="bg-[#E58F40] text-[#3d3835] rounded-full w-6 h-6 flex items-center justify-center text-sm">✦</span>
               {sec.title}
             </h2>
             <div className="text-sm space-y-1 text-gray-300 [&_ul]:list-disc [&_ul]:ml-4 [&_p]:my-1 [&_li]:my-0">
               <ReactMarkdown>{sec.content}</ReactMarkdown>
             </div>
           </div>
         ))}
      </div>

      <div className="w-2/3 bg-white p-8 rounded-r-lg">
         <div className="mb-8 border-b-2 border-[#E58F40] pb-6">
           <h1 className="text-5xl font-bold mb-2 font-serif text-[#3d3835]">
             {firstName} <span className="text-[#E58F40]">{restName}</span>
           </h1>
         </div>

         {rightSections.map(sec => (
           <div key={sec.title} className="mb-6">
             <h2 className="text-lg font-bold uppercase mb-3 bg-[#E58F40] text-white px-3 py-1 inline-block tracking-widest rounded-sm">
               {sec.title}
             </h2>
             <div className="text-[#3d3835] text-sm [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-1 [&_p]:my-2 [&_ul]:list-none [&_li]:relative [&_li]:pl-4 [&_li]:before:content-['•'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-[#E58F40] [&_li]:my-1">
               <ReactMarkdown>{sec.content}</ReactMarkdown>
             </div>
           </div>
         ))}
      </div>
    </div>
  );
};

const MinimalistTemplate = ({ result, margin }: { result: string, margin: number }) => {
  const { name, contactLines, sections } = parseResumeMarkdown(result);

  return (
    <div className="bg-white text-left font-sans" style={{ minHeight: '100%', padding: `${margin}mm`, boxSizing: 'border-box' }}>
      <header className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
        <h1 className="text-4xl font-bold uppercase tracking-wide text-black">{name}</h1>
      </header>

      <div className="flex mb-8 border-b border-gray-300 pb-4">
        <div className="w-1/4 pr-4">
           <h2 className="text-sm font-bold uppercase tracking-wider text-black">
             Contact
           </h2>
        </div>
        <div className="w-3/4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-black [&_p]:m-0">
           {contactLines.map((line, i) => (
             <div key={i}><ReactMarkdown>{line}</ReactMarkdown></div>
           ))}
        </div>
      </div>

      {sections.map(sec => (
        <div key={sec.title} className="mb-6 flex">
          <div className="w-1/4 pr-4">
             <h2 className="text-sm font-bold uppercase tracking-wider text-black">
               {sec.title}
             </h2>
          </div>
          <div className="w-3/4">
             <div className="text-sm text-black [&_h3]:font-bold [&_h3]:text-base [&_h3]:mt-0 [&_h3]:mb-1 [&_p]:my-1 [&_ul]:list-disc [&_ul]:ml-4 [&_li]:my-1 [&_strong]:font-bold">
               <ReactMarkdown>{sec.content}</ReactMarkdown>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};
