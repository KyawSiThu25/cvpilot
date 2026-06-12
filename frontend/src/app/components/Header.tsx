"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageContext";

const NAV_ITEMS = [
  { href: "/", label: "Resume Tailor" },
  { href: "/ats-score", label: "ATS Score" },
];

export default function Header() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "var(--bg-primary)",
        borderBottom: "2px solid var(--border-primary)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5"
          style={{ textDecoration: "none" }}
        >
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.35rem",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            CVPilot
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.8rem",
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase" as const,
                  color: isActive
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                  textDecoration: "none",
                  borderBottom: isActive
                    ? "2px solid var(--text-primary)"
                    : "2px solid transparent",
                  transition: "color 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text-muted)";
                  }
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setLanguage("en")}
            style={{
              padding: "4px 8px",
              fontSize: "0.75rem",
              fontWeight: language === "en" ? 600 : 400,
              fontFamily: "var(--font-body)",
              color: language === "en" ? "var(--text-primary)" : "var(--text-muted)",
              background: language === "en" ? "var(--bg-secondary)" : "transparent",
              border: "1px solid",
              borderColor: language === "en" ? "var(--border-primary)" : "transparent",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("my")}
            style={{
              padding: "4px 8px",
              fontSize: "0.75rem",
              fontWeight: language === "my" ? 600 : 400,
              fontFamily: "var(--font-body)",
              color: language === "my" ? "var(--text-primary)" : "var(--text-muted)",
              background: language === "my" ? "var(--bg-secondary)" : "transparent",
              border: "1px solid",
              borderColor: language === "my" ? "var(--border-primary)" : "transparent",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            MY
          </button>
        </div>
      </div>
    </header>
  );
}
