import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { LanguageProvider } from "./components/LanguageContext";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CVPilot — AI Resume Tailor",
  description:
    "Optimize your resume for any job posting with AI-powered ATS keyword matching and professional formatting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <Header />
          <div className="flex-1">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
