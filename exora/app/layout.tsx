import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers";
import "./globals.css"

export const metadata: Metadata = {
  title: "Exora Analytics Dashboard",
  description: "Comprehensive analytics dashboard for actionable insights",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <div className="min-h-screen w-full bg-black relative">
          {/* Background */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(58, 123, 255, 0.15) 0%, rgba(123, 104, 238, 0.07) 35%, transparent 50%)`,
            }}
          />
          {/* Content wrapped in Providers so global client features (ApiKeyModal) mount */}
          <div className="relative z-10">
            <Providers>
              {children}
              <footer className="mt-24 border-t border-slate-800/60 bg-gradient-to-b from-transparent to-slate-950/60 text-[11px] text-slate-400 px-6 py-10">
                <div className="max-w-6xl mx-auto flex flex-col gap-4">
                  <p className="leading-relaxed">
                    <span className="font-semibold text-slate-200">Usage & Billing:</span> Searches call the Exa API directly with any key you provide (BYOK). Costs accrue to your Exa account per their pricing. We do not retain your key beyond the active browser session and do not resell or re-host your data.
                  </p>
                  <p className="leading-relaxed">
                    <span className="font-semibold text-slate-200">AI Output Reliability:</span> Summaries, classifications, and sentiment leverage LLMs and heuristic enrichment. They may be incomplete or imprecise. Always independently verify critical or high‑impact decisions.
                  </p>
                  <p className="leading-relaxed">
                    <span className="font-semibold text-slate-200">Data Scope:</span> News & web insights are point‑in‑time and may omit recent changes. No guarantee of exhaustiveness or regulatory compliance.
                  </p>
                  <p className="pt-2 text-slate-500">© {new Date().getFullYear()} Exora. All rights reserved.</p>
                </div>
              </footer>
            </Providers>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}