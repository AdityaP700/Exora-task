// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import all our functional components and types
import { Navbar } from "@/components/layouts/navbar"; // The stunning navbar
import { AllInvestorView } from "@/components/all-investor-view";
import { TrendAnalysisView } from "@/components/trend-analysis-view";
import { AnalysisView } from "@/components/analysis-view";
import { SummaryView } from "@/components/summary-view";
import { AISidekickChat } from "@/components/ai-sidekick-chat";
import { CompanyOverviewCard } from "@/components/company-overview-card";
import { NewsFeed } from "@/components/news-feed";
import { CompetitorNews } from "@/components/competitor-news";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BriefingResponse } from "@/lib/types";
import { Badge } from '@/components/ui/badge';
import { ArrowUp } from 'lucide-react';
import { LoaderFour } from "@/components/ui/loader";

// A skeleton loader that matches the final results layout
function DashboardSkeleton() {
    return (
        <div className="animate-pulse container mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="h-80 bg-slate-900/50 rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-52 bg-slate-900/50 rounded-lg"></div>
                    <div className="h-52 bg-slate-900/50 rounded-lg"></div>
                </div>
            </div>
            <div className="lg:col-span-1">
                <div className="h-full bg-slate-900/50 rounded-lg"></div>
            </div>
        </div>
    );
}

export default function ExoraPage() {
  const [briefingData, setBriefingData] = useState<BriefingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Three-view toggle: overview, analysis, summary
  const [activeView, setActiveView] = useState<"overview" | "analysis" | "summary">("overview");
  const [lastQuery, setLastQuery] = useState<string>("");

  // Restore last briefing from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('exora:lastBriefing')
      const cachedQuery = localStorage.getItem('exora:lastQuery')
      if (cached) setBriefingData(JSON.parse(cached))
      if (cachedQuery) setLastQuery(cachedQuery)
    } catch {}
  }, [])

  // Layer 1: Frontend sanity checker for domains (simple and forgiving)
  const looksLikeDomain = (input: string) => {
    const value = (input || "").trim().toLowerCase();
    const noScheme = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const hostOnly = noScheme.split('/')[0].split('?')[0].split('#')[0].replace(/:\d+$/, '');
    // basic domain regex: label.label (allow subdomains), alphanum and hyphens
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(hostOnly);
  };

  const handleSearch = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    setBriefingData(null);

    try {
      // Frontend sanity check prior to API call
      if (!looksLikeDomain(domain)) {
        throw new Error("Please enter a valid company domain, e.g. stripe.com");
      }
  // 🔧 FIXED: The fetch call is now extremely simple. No headers needed.
  const noScheme = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')
  const cleanedDomain = noScheme.split('/')[0].split('?')[0].split('#')[0].replace(/:\d+$/, '')
  setLastQuery(cleanedDomain)
  const response = await fetch(`/api/briefing?domain=${cleanedDomain}`);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || errData.error || "Failed to fetch briefing.");
      }
      const data: BriefingResponse = await response.json();
      setBriefingData(data);
      try {
        localStorage.setItem('exora:lastBriefing', JSON.stringify(data))
        localStorage.setItem('exora:lastQuery', cleanedDomain)
      } catch {}
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Background Glow */}
      <div
        className="absolute inset-0 z-0 opacity-50"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(var(--glow-start-rgb), 0.3) 0%, rgba(var(--glow-end-rgb), 0.15) 35%, transparent 60%)`,
        }}
      />
      
      <div className="relative z-10">
        <Navbar />

        <main>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Keep hero static with entered query visible */}
                <div className="container mx-auto px-4 pt-32 pb-16 text-center flex flex-col items-center">
                  <h1 className="text-5xl md:text-7xl font-bold text-slate-50 tracking-tight">
                    Paste. <span className="relative inline-block">Analyze.<span className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[var(--circle-start)] to-[var(--circle-end)]" /></span> Understand.
                  </h1>
                  <div className="mt-8 w-full max-w-3xl mx-auto">
                    <AIInputWithSearch
                      placeholder={lastQuery ? lastQuery : "Enter a company URL to begin... (e.g., perplexity.ai)"}
                      onSubmit={(value) => handleSearch(value)}
                      className="[& textarea]:h-10"
                    />
                  </div>
                  <div className="mt-10 flex flex-col items-center gap-3">
                    <LoaderFour text="Assembling competitive intelligence…" />
                    <div className="text-slate-400 text-xs">Curating signals, sentiment, and market positioning</div>
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-red-400 mt-20 p-4">
                <h3 className="font-bold">An Error Occurred</h3>
                <p className="mb-4">{error}</p>
                <button className="text-sm underline" onClick={() => lastQuery ? handleSearch(lastQuery) : null}>Try again</button>
              </motion.div>
            ) : briefingData ? (
              // --- THE RESULTS DASHBOARD VIEW ---
              <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="container mx-auto px-4 mt-24">
                  {/* Persistent Search at the top */}
                  <div className="w-full max-w-3xl mx-auto">
                    <AIInputWithSearch
                      placeholder="Enter a company URL to analyze... (e.g., perplexity.ai)"
                      onSubmit={(value) => handleSearch(value)}
                      className="[& textarea]:h-10"
                    />
                  </div>
                  {/* Three-toggle under search */}
                  <div className="mt-6 flex items-center justify-center">
                    <ToggleGroup value={activeView} onValueChange={(v) => v && setActiveView(v as any)}>
                      <ToggleGroupItem value="overview" aria-label="Overview">Overview</ToggleGroupItem>
                      <ToggleGroupItem value="analysis" aria-label="Analysis">Analysis</ToggleGroupItem>
                      <ToggleGroupItem value="summary" aria-label="Summary">Summary</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {/* Switchable views */}
                 {/* Switchable views - matching wireframe split */}
{activeView === "overview" && (
  <div className="mt-11 grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* ~33% for company overview (1/3) */}
    <div className="lg:col-span-1 space-y-6">
      <CompanyOverviewCard profile={briefingData.companyProfile} founders={briefingData.founderInfo} />
      {/* Quick TL;DR panel for staged feel */}
      {/* <AISidekickChat data={briefingData.aiSummary} /> */}
    </div>
    
    {/* ~67% for news sections (2/3) */}
    <div className="lg:col-span-2 space-y-5">
      <NewsFeed title="Latest Company News" items={briefingData.newsFeed} />
      <CompetitorNews competitors={briefingData.benchmarkMatrix} />
    </div>
  </div>
)}


                  {activeView === "analysis" && (
                    <div className="mt-8">
                      <AnalysisView data={briefingData} />
                    </div>
                  )}

                  {activeView === "summary" && (
                    <div className="mt-8">
                      <SummaryView data={briefingData.aiSummary} />
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              // --- THE INITIAL HERO SEARCH VIEW ---
              <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="container mx-auto px-4 pt-32 pb-24 text-center flex flex-col items-center">
                    <div className="flex justify-center gap-4 mb-8">
                        
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-slate-50 tracking-tight">
                      Paste.{" "}
                      <span className="relative inline-block">
                        Analyze.
                        <span className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[var(--circle-start)] to-[var(--circle-end)]" />
                      </span>{" "}
                      Understand.
                    </h1>

                    <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-400">
                      Transform any company URL into comprehensive market intelligence. Get competitive benchmarks, sentiment analysis, and AI-powered strategic insights—all in under 30 seconds.
                    </p>
                    
                    <div className="mt-12 w-full max-w-3xl">
                      <AIInputWithSearch
                        placeholder="Enter a company URL to begin... (e.g., perplexity.ai)"
                        onSubmit={(value) => handleSearch(value)}
                        className="[& textarea]:h-10"
                      />
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}