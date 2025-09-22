// app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import all our functional components and types
import { Navbar } from "@/components/layouts/navbar";
import { AnalysisView } from "@/components/analysis-view";
import { SummaryView } from "@/components/summary-view";
import { CompanyOverviewCard } from "@/components/company-overview-card";
import { NewsFeed } from "@/components/news-feed";
import { CompetitorNews } from "@/components/competitor-news";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { BriefingResponse, AiSummaryData, CompanyProfile, FounderInfo, BenchmarkMatrixRow, NewsItem } from "@/lib/types";
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
  // Staged progressive state
  const [domain, setDomain] = useState<string>("")
  const [overview, setOverview] = useState<string>("")
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [founders, setFounders] = useState<FounderInfo[]>([])
  const [competitors, setCompetitors] = useState<string[]>([])
  const [companyNews, setCompanyNews] = useState<Array<{headline:string;url:string;source?:string;publishedDate?:string}>>([])
  const [competitorNews, setCompetitorNews] = useState<Array<{domain:string;headline:string;url:string;source?:string;publishedDate?:string}>>([])
  const [benchmark, setBenchmark] = useState<Array<{domain:string;narrativeMomentum:number;sentimentScore:number;pulseIndex:number}>>([])
  const [summaryText, setSummaryText] = useState<string>("")

  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Three-view toggle: overview, analysis, summary
  const [activeView, setActiveView] = useState<
    "overview" | "analysis" | "summary"
  >("overview");
  const [lastQuery, setLastQuery] = useState<string>("");
  const esRef = useRef<EventSource | null>(null)

  // Restore last domain on mount
  useEffect(() => {
    try {
      const cachedQuery = localStorage.getItem("exora:lastQuery");
      if (cachedQuery) setLastQuery(cachedQuery);
    } catch {}
  }, []);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  }, [])

  // Layer 1: Frontend sanity checker for domains (simple and forgiving)
  const looksLikeDomain = (input: string) => {
    const value = (input || "").trim().toLowerCase();
    const noScheme = value.replace(/^https?:\/\//, "").replace(/^www\./, "");
    const hostOnly = noScheme
      .split("/")[0]
      .split("?")[0]
      .split("#")[0]
      .replace(/:\d+$/, "");
    // basic domain regex: label.label (allow subdomains), alphanum and hyphens
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(hostOnly);
  };

  const handleSearch = async (input: string) => {
    setError(null)
    // reset staged state
    setOverview("")
    setProfile(null)
    setFounders([])
    setCompetitors([])
    setCompanyNews([])
    setCompetitorNews([])
    setBenchmark([])
    setSummaryText("")

    try {
      if (!looksLikeDomain(input)) {
        throw new Error("Please enter a valid company domain, e.g. stripe.com")
      }
      const noScheme = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "")
      const cleanedDomain = noScheme.split("/")[0].split("?")[0].split("#")[0].replace(/:\d+$/, "")
      setLastQuery(cleanedDomain)
      setDomain(cleanedDomain)
      try { localStorage.setItem("exora:lastQuery", cleanedDomain) } catch {}

      // Open SSE stream
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
      const es = new EventSource(`/api/briefing/stream?domain=${cleanedDomain}`)
      esRef.current = es
      setIsStreaming(true)

      es.addEventListener('overview', (ev: MessageEvent) => {
        try {
          const { overview: text } = JSON.parse(ev.data)
          setOverview(text || "")
          // Bootstrap a minimal profile fast
          setProfile((prev) => prev ?? ({
            name: cleanedDomain.split('.')[0],
            domain: cleanedDomain,
            description: text || `Company at ${cleanedDomain}`,
            ipoStatus: 'Unknown',
            socials: {}
          } as CompanyProfile))
        } catch {}
      })

      es.addEventListener('founders', (ev: MessageEvent) => {
        try {
          const { founders } = JSON.parse(ev.data)
          setFounders(Array.isArray(founders) ? founders : [])
        } catch {}
      })

      es.addEventListener('socials', (ev: MessageEvent) => {
        try {
          const { socials } = JSON.parse(ev.data)
          setProfile((prev) => prev ? { ...prev, socials: socials || {} } : null)
        } catch {}
      })

      es.addEventListener('competitors', (ev: MessageEvent) => {
        try {
          const { competitors } = JSON.parse(ev.data)
          setCompetitors(Array.isArray(competitors) ? competitors : [])
        } catch {}
      })

      es.addEventListener('company-news', (ev: MessageEvent) => {
        try {
          const { news } = JSON.parse(ev.data)
          setCompanyNews(Array.isArray(news) ? news : [])
        } catch {}
      })

      es.addEventListener('competitor-news', (ev: MessageEvent) => {
        try {
          const { news } = JSON.parse(ev.data)
          setCompetitorNews(Array.isArray(news) ? news : [])
        } catch {}
      })

      es.addEventListener('sentiment', (ev: MessageEvent) => {
        try {
          const { benchmark } = JSON.parse(ev.data)
          setBenchmark(Array.isArray(benchmark) ? benchmark : [])
        } catch {}
      })

      es.addEventListener('summary', (ev: MessageEvent) => {
        try {
          const { summary } = JSON.parse(ev.data)
          setSummaryText(typeof summary === 'string' ? summary : "")
        } catch {}
      })

      es.addEventListener('error', (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data)
          setError(data?.message || 'Stream error')
        } catch {
          setError('Stream error')
        }
        setIsStreaming(false)
        es.close()
      })

      es.addEventListener('done', () => {
        setIsStreaming(false)
        es.close()
      })

    } catch (err: any) {
      setError(err.message || 'Failed to start stream')
      setIsStreaming(false)
    }
  };
  // Derived helpers for rendering existing components
  const companyNewsItems: NewsItem[] = useMemo(() => {
    return (companyNews || []).map(n => ({
      date: n.publishedDate || new Date().toISOString(),
      type: 'Other',
      headline: n.headline,
      url: n.url
    }))
  }, [companyNews])

  const competitorRowsForOverview: BenchmarkMatrixRow[] = useMemo(() => {
    // Group competitor news by domain
    const map = new Map<string, { headline:string; url:string; source:string }[]>()
    for (const item of competitorNews) {
      const list = map.get(item.domain) || []
      list.push({ headline: item.headline, url: item.url, source: item.source || 'news' })
      map.set(item.domain, list)
    }
    return Array.from(map.entries()).map(([d, news]) => ({
      domain: d,
      pulseIndex: 0,
      narrativeMomentum: 0,
      sentimentScore: 0,
      historicalData: [],
      news
    }))
  }, [competitorNews])

  const analysisData: BriefingResponse | null = useMemo(() => {
    if (!profile) return null
    if (!benchmark.length) return null
    const domains = [domain, ...competitors]
    // Attach news for main and competitors if available
    const newsByDomain = new Map<string, { headline:string; url:string; source:string }[]>()
    newsByDomain.set(domain, (companyNews || []).map(n => ({ headline: n.headline, url: n.url, source: n.source || 'news' })))
    for (const cn of competitorNews) {
      const list = newsByDomain.get(cn.domain) || []
      list.push({ headline: cn.headline, url: cn.url, source: cn.source || 'news' })
      newsByDomain.set(cn.domain, list)
    }
    const benchmarkMatrix: BenchmarkMatrixRow[] = benchmark.map(b => ({
      domain: b.domain,
      pulseIndex: b.pulseIndex,
      narrativeMomentum: b.narrativeMomentum,
      sentimentScore: b.sentimentScore,
      historicalData: [],
      news: newsByDomain.get(b.domain) || []
    }))

    const aiSummary: AiSummaryData = {
      groqTlDr: overview,
      summary: summaryText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('•') && l.length > 2)
        .slice(0, 3)
    }

    return {
      requestDomain: domain,
      companyProfile: profile,
      founderInfo: founders,
      benchmarkMatrix,
      newsFeed: companyNewsItems,
      aiSummary
    }
  }, [profile, benchmark, overview, summaryText, domain, founders, competitors, companyNews, competitorNews, companyNewsItems])

  const hasStarted = !!overview || isStreaming

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

      {/* 🔧 FIXED: Always visible hero section */}
      <div className="container mx-auto px-4 pt-20 pb-8 text-center">
        <div className="flex justify-center gap-4 mb-6">
          {/* Optional: Add some icons or badges here */}
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-50 tracking-tight">
          <span className="relative inline-block">
            Decode
            <span className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[var(--circle-start)] to-[var(--circle-end)]" />
          </span>{" "}
          Any Competitor.{" "}
          <span className="text-slate-300">
            Instantly.
          </span>
        </h1>

        <p className="mt-4 max-w-3xl mx-auto text-base md:text-lg text-slate-400 leading-relaxed">
          <span className="text-slate-300 font-medium">Drop any company URL.</span> Get Quick real-time competitive, market positioning, sentiment analysis, and strategic insights within minutes.
        </p>
      </div>

      <main>
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-4 text-center"
            >
              <div className="w-full max-w-3xl mx-auto mb-8">
                <AIInputWithSearch
                  placeholder="Try a different company URL..."
                  onSubmit={(value) => handleSearch(value)}
                  className="[& textarea]:h-10"
                />
              </div>
              <div className="text-center text-red-400 p-4">
                <h3 className="font-bold text-lg">Analysis Failed</h3>
                <p className="mb-4 text-slate-400">{error}</p>
                <button
                  className="text-sm underline hover:no-underline transition-all"
                  onClick={() => (lastQuery ? handleSearch(lastQuery) : null)}
                >
                  Retry Analysis →
                </button>
              </div>
            </motion.div>
          ) : hasStarted ? (
            <motion.div
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="container mx-auto px-4">
                {/* Persistent search */}
                <div className="w-full max-w-3xl mx-auto mb-6">
                  <AIInputWithSearch
                    placeholder={lastQuery || "Enter any company URL... (e.g., stripe.com, openai.com)"}
                    onSubmit={(value) => handleSearch(value)}
                    className="[& textarea]:h-9 opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* Stage progress helper under input */}
                {isStreaming && (
                  <div className="mb-6 flex items-center justify-center gap-3 text-xs text-slate-400">
                    <LoaderFour text="Streaming results progressively…" />
                  </div>
                )}

                {/* Three-toggle under search */}
                <div className="mb-8 flex items-center justify-center">
                  <ToggleGroup
                    value={activeView}
                    onValueChange={(v) => v && setActiveView(v as any)}
                  >
                    <ToggleGroupItem value="overview" aria-label="Overview">
                       Overview
                    </ToggleGroupItem>
                    <ToggleGroupItem value="analysis" aria-label="Analysis">
                       Analysis
                    </ToggleGroupItem>
                    <ToggleGroupItem value="summary" aria-label="Summary">
                       Summary
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {activeView === "overview" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                      {profile ? (
                        <CompanyOverviewCard
                          profile={profile}
                          founders={founders}
                        />
                      ) : (
                        <div className="p-6 rounded-lg bg-slate-900/50 text-slate-400 text-sm">
                          <div className="mb-2 font-medium text-slate-300">Company Overview</div>
                          <div>Preparing overview…</div>
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-2 space-y-5">
                      <NewsFeed
                        title="Latest Company News"
                        items={companyNewsItems}
                      />
                      <CompetitorNews
                        competitors={competitorRowsForOverview}
                      />
                    </div>
                  </div>
                )}

                {activeView === "analysis" && (
                  <div className="mt-8">
                    {analysisData ? (
                      <AnalysisView data={analysisData} />
                    ) : (
                      <div className="p-6 rounded-lg bg-slate-900/50 text-slate-400 text-sm flex items-center gap-2">
                        <LoaderFour text="Computing sentiment and momentum…" />
                        <span>Charts will appear shortly.</span>
                      </div>
                    )}
                  </div>
                )}

                {activeView === "summary" && (
                  <div className="mt-8">
                    <SummaryView data={{
                      groqTlDr: overview,
                      summary: summaryText
                        ? summaryText.split('\n').map(l => l.trim()).filter(l => l.startsWith('•') && l.length > 2).slice(0,3)
                        : []
                    }} />
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            // --- THE INITIAL HERO SEARCH VIEW ---
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="container mx-auto px-4 pb-24 text-center flex flex-col items-center">
                {/* 🔧 ENHANCED: More compelling CTA section */}
                <div className="mt-8 w-full max-w-3xl">
                  <AIInputWithSearch
                    placeholder="Enter any company URL to decode their market position... (e.g., stripe.com)"
                    onSubmit={(value) => handleSearch(value)}
                    className="[& textarea]:h-12 [& textarea]:text-base"
                  />
                  
                  {/* 🔧 NEW: Popular examples */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className="text-slate-500">Try:</span>
                    {['openai.com', 'stripe.com', 'notion.so', 'figma.com'].map((example) => (
                      <button
                        key={example}
                        onClick={() => handleSearch(example)}
                        className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🔧 NEW: Social proof / features */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
                  <div className="text-center md:text-left">
                    <div className="text-2xl mb-2">🎯</div>
                    <h3 className="text-slate-200 font-semibold mb-2">Competitive Positioning</h3>
                    <p className="text-slate-400 text-sm">See exactly how any company stacks up against their key competitors in real-time market analysis.</p>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl mb-2">📈</div>
                    <h3 className="text-slate-200 font-semibold mb-2">Sentiment Intelligence</h3>
                    <p className="text-slate-400 text-sm">Track brand perception, narrative momentum, and market sentiment across multiple data sources.</p>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl mb-2">⚡</div>
                    <h3 className="text-slate-200 font-semibold mb-2">Instant Strategic Insights</h3>
                    <p className="text-slate-400 text-sm">Get VC-grade strategic analysis and actionable recommendations in seconds, not weeks.</p>
                  </div>
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