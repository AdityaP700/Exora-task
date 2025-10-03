// app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApiKeyStore } from '@/lib/store';
import { motion, AnimatePresence } from "framer-motion";

// Import all our functional components and types
import { Navbar } from "@/components/layouts/navbar";
import { AnalysisView } from "@/components/analysis-view";
import { SummaryView } from "@/components/summary-view";
import { CompanyOverviewCard } from "@/components/company-overview-card";
import { CompanyNewsGrid } from "@/components/company-news-grid";
import { CompetitorNews } from "@/components/competitor-news";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
  BriefingResponse,
  AiSummaryData,
  CompanyProfile,
  FounderInfo,
  BenchmarkMatrixItem,
  NewsItem,
  EventLogItem,
  SentimentHistoricalDataPoint,
  EnhancedSentimentAnalysis,
} from "@/lib/types";
import { LoaderFour } from "@/components/ui/loader";

import { PrimarySentimentCard } from "@/components/primary-sentiment-card";
import { CompetitorSentimentCard } from "@/components/competitor-sentiment-card";
import { DetailedSentimentAnalysis } from "@/components/detailed-sentiment-analysis";
import { CompetitorSentimentComparison } from "@/components/competitor-sentiment-comparison";
import { FeatureCards } from "@/components/feature-cards";

// Lightweight EXA usage / billing transparency banner (with compact variant)
function ExaUsageBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        "rounded-md border border-blue-900/40 bg-gradient-to-r from-blue-950/60 to-slate-900/40 backdrop-blur px-4 py-3 text-left shadow-inner shadow-blue-900/20 " +
        (compact ? "mt-3" : "mt-6")
      }
    >
      <p className="text-[11px] leading-relaxed text-slate-300/90">
        <span className="font-semibold text-slate-200">Data Notice:</span> Each search dispatches live Exa API calls (search + news) using <span className="font-medium">your provided Exa key</span>. You are billed directly by Exa per their pricing after 500 searches. We don’t store or proxy your key beyond this session.
        {" "}
        <span className="text-slate-400">LLM summaries & sentiment may be probabilistic; always verify critical facts.</span>
      </p>
    </div>
  );
}

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
  const [domain, setDomain] = useState<string>("");
  const [overview, setOverview] = useState<string>("");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [founders, setFounders] = useState<FounderInfo[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [companyNews, setCompanyNews] = useState<
    Array<{
      headline: string;
      url: string;
      source?: string;
      publishedDate?: string;
    }>
  >([]);
  const [competitorNews, setCompetitorNews] = useState<
    Array<{
      domain: string;
      headline: string;
      url: string;
      source?: string;
      publishedDate?: string;
    }>
  >([]);
  const [benchmark, setBenchmark] = useState<
    Array<{
      domain: string;
      narrativeMomentum: number;
      sentimentScore: number;
      pulseIndex: number;
      sentimentHistoricalData?: SentimentHistoricalDataPoint[];
      enhancedSentiment?: EnhancedSentimentAnalysis;
    }>
  >([]);
  const [summaryText, setSummaryText] = useState<string>("");

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Three-view toggle: overview, analysis, summary
  const [activeView, setActiveView] = useState<
    "overview" | "analysis" | "summary"
  >("overview");
  const [lastQuery, setLastQuery] = useState<string>("");
  const esRef = useRef<EventSource | null>(null);

  // Restore last domain (prompt instead of auto-run)
  const [resumePrompt, setResumePrompt] = useState(false);
  useEffect(() => {
    try {
      const cachedQuery = localStorage.getItem("exora:lastQuery");
      if (cachedQuery) {
        setLastQuery(cachedQuery);
        setResumePrompt(true);
      }
    } catch {}
  }, []);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);

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
    setError(null);
    // reset staged state
    setOverview("");
    setProfile(null);
    setFounders([]);
    setCompetitors(["exxonmobil.com", "shell.com", "bp.com"]);
    setCompanyNews([]);
    setCompetitorNews([]);
    setBenchmark([]);
    setSummaryText("");

    try {
      if (!looksLikeDomain(input)) {
        throw new Error("Please enter a valid company domain, e.g. stripe.com");
      }
      const noScheme = input
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "");
      const cleanedDomain = noScheme
        .split("/")[0]
        .split("?")[0]
        .split("#")[0]
        .replace(/:\d+$/, "");
      setLastQuery(cleanedDomain);
      setDomain(cleanedDomain);
      try {
        localStorage.setItem("exora:lastQuery", cleanedDomain);
      } catch {}

      // Ensure Exa key present (BYOK gating)
      try {
        const { exaApiKey, openModal } = useApiKeyStore.getState();
        if (!exaApiKey) {
          openModal();
          setError('Exa API key required. Add it to proceed.');
          return;
        }
      } catch {}

      // Open SSE stream
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      // Inject user-provided API keys (BYOK) encoded client-side so server can build dynamic providers.
      let es: EventSource | null = null;
      try {
        const { exaApiKey, groqApiKey, geminiApiKey, openAiApiKey } = useApiKeyStore.getState();
        const keyPayload: Record<string,string> = {};
        if (exaApiKey) keyPayload.exa = exaApiKey.trim();
        if (groqApiKey) keyPayload.groq = groqApiKey.trim();
        if (geminiApiKey) keyPayload.gemini = geminiApiKey.trim();
        if (openAiApiKey) keyPayload.openai = openAiApiKey.trim();
        const b64 = Object.keys(keyPayload).length
          ? encodeURIComponent(
              btoa(unescape(encodeURIComponent(JSON.stringify(keyPayload))))
                .replace(/=/g,'')
                .replace(/\+/g,'-')
                .replace(/\//g,'_')
            )
          : '';
        const url = `/api/briefing/stream?domain=${cleanedDomain}` + (b64 ? `&keys=${b64}` : '');
        es = new EventSource(url);
        esRef.current = es;
      } catch {
        es = new EventSource(`/api/briefing/stream?domain=${cleanedDomain}`);
        esRef.current = es;
      }
      setIsStreaming(true);

      if (!es) return;
      es.addEventListener("overview", (ev: MessageEvent) => {
        try {
          const { overview: text } = JSON.parse(ev.data);
          setOverview(text || "");
          // Bootstrap a minimal profile fast
          setProfile((prev) => {
            if (prev) return prev;
            return {
              name: cleanedDomain.split(".")[0],
              domain: cleanedDomain,
              description: text || `Company at ${cleanedDomain}`,
              ipoStatus: "Unknown",
              socials: {},
            } as CompanyProfile;
          });
        } catch {}
      });

      // NEW: canonical enrichment (arrives before profile sometimes)
      es.addEventListener("canonical", (ev: MessageEvent) => {
        try {
          const { canonical } = JSON.parse(ev.data);
          if (!canonical) return;
          setProfile((prev) => {
            if (!prev) return prev; // wait for minimal bootstrap from overview
            const baseStem = cleanedDomain.split('.')[0].toLowerCase();
            const currentName = prev.name || baseStem;
            const incoming = canonical.canonicalName || currentName;
            const looksGeneric = !currentName || currentName.toLowerCase() === baseStem || currentName.length < 4;
            return {
              ...prev,
              name: looksGeneric ? incoming : prev.name,
              canonicalName: canonical.canonicalName,
              aliases: canonical.aliases,
              industry: prev.industry || canonical.industryHint || prev.industry,
            };
          });
        } catch {}
      });

      // NEW: structured profile snapshot (server enriched snapshotProfile)
      es.addEventListener("profile", (ev: MessageEvent) => {
        try {
          const { profile: incoming } = JSON.parse(ev.data);
          if (!incoming) return;
          setProfile((prev) => {
            if (!prev) return incoming;
            // Avoid updates if nothing materially changed
            const fieldsToCheck: (keyof CompanyProfile)[] = ['description','brief','industry','foundedYear','headquarters','headcountRange','employeeCountApprox','ipoStatus','profileDataQuality','canonicalName'];
            let changed = false;
            for (const f of fieldsToCheck) {
              if ((incoming as any)[f] && (incoming as any)[f] !== (prev as any)[f]) { changed = true; break; }
            }
            const socialsChanged = JSON.stringify(incoming.socials||{}) !== JSON.stringify(prev.socials||{});
            const aliasesChanged = !!(incoming.aliases && incoming.aliases.join('|') !== (prev.aliases||[]).join('|'));
            if (!changed && !socialsChanged && !aliasesChanged) return prev;
            const merged: CompanyProfile = { ...prev } as CompanyProfile;
            if ((incoming.description||'').length > (prev.description||'').length + 25) merged.description = incoming.description;
            if (!prev.brief && incoming.brief) merged.brief = incoming.brief;
            const copyIf = <K extends keyof CompanyProfile>(k: K) => { if (incoming[k] && !prev[k]) (merged as any)[k] = incoming[k]; };
            copyIf('industry'); copyIf('foundedYear'); copyIf('headquarters'); copyIf('headcountRange'); copyIf('employeeCountApprox'); copyIf('ipoStatus');
            if (incoming.socials && Object.keys(incoming.socials).length) merged.socials = { ...(prev.socials||{}), ...incoming.socials };
            if (incoming.profileDataQuality) merged.profileDataQuality = incoming.profileDataQuality;
            if (incoming.canonicalName) merged.canonicalName = incoming.canonicalName;
            if (incoming.aliases?.length) merged.aliases = incoming.aliases;
            return merged;
          });
        } catch {}
      });

      es.addEventListener("founders", (ev: MessageEvent) => {
        try {
          const { founders } = JSON.parse(ev.data);
          setFounders(Array.isArray(founders) ? founders : []);
        } catch {}
      });

      es.addEventListener("socials", (ev: MessageEvent) => {
        try {
          const { socials } = JSON.parse(ev.data);
          setProfile((prev) =>
            prev ? { ...prev, socials: socials || {} } : null
          );
        } catch {}
      });

      es.addEventListener("competitors", (ev: MessageEvent) => {
        try {
          const { competitors } = JSON.parse(ev.data);
          setCompetitors(Array.isArray(competitors) ? competitors : []);
        } catch {}
      });

      es.addEventListener("company-news", (ev: MessageEvent) => {
        try {
          const { news } = JSON.parse(ev.data);
          setCompanyNews(Array.isArray(news) ? news : []);
        } catch {}
      });

      es.addEventListener("competitor-news", (ev: MessageEvent) => {
        try {
          const { news } = JSON.parse(ev.data);
          setCompetitorNews(Array.isArray(news) ? news : []);
        } catch {}
      });

      es.addEventListener("sentiment", (ev: MessageEvent) => {
        try {
          const { benchmark } = JSON.parse(ev.data);
          if (Array.isArray(benchmark)) {
            // Debug surface: verify enhancedSentiment propagation in dev tools
            console.debug(
              "[SSE] sentiment event received – sample item:",
              benchmark[0]?.domain,
              benchmark[0]?.enhancedSentiment
            );
            setBenchmark(benchmark);
          } else {
            setBenchmark([]);
          }
        } catch (e) {
          console.warn("[SSE] failed to parse sentiment event", e);
        }
      });

      es.addEventListener("summary", (ev: MessageEvent) => {
        try {
          const { summary } = JSON.parse(ev.data);
          setSummaryText(typeof summary === "string" ? summary : "");
        } catch {}
      });

      es.addEventListener("error", (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data);
          setError(data?.message || "Stream error");
        } catch {
          setError("Stream error");
        }
        setIsStreaming(false);
        es.close();
      });

      es.addEventListener("done", () => {
        setIsStreaming(false);
        es.close();
      });
    } catch (err: any) {
      setError(err.message || "Failed to start stream");
      setIsStreaming(false);
    }
  };
  // Derived helpers for rendering existing components
  const companyNewsItems: EventLogItem[] = useMemo(() => {
    return (companyNews || []).map((n) => ({
      date: n.publishedDate || new Date().toISOString(),
      type: "Other",
      headline: n.headline,
      url: n.url,
    }));
  }, [companyNews]);

  const competitorRowsForOverview: BenchmarkMatrixItem[] = useMemo(() => {
    // Group competitor news by domain
    const map = new Map<string, NewsItem[]>();
    for (const item of competitorNews) {
      const list = map.get(item.domain) || [];
      list.push({
        headline: item.headline,
        url: item.url,
        source: item.source || "news",
        publishedDate: item.publishedDate || new Date().toISOString(),
        date: item.publishedDate || new Date().toISOString(),
        type: "Other",
      });
      map.set(item.domain, list);
    }
    return Array.from(map.entries()).map(([d, news]) => ({
      domain: d,
      pulseIndex: 0,
      narrativeMomentum: 0,
      sentimentScore: 0,
      historicalData: [],
      news,
    }));
  }, [competitorNews]);

  // Ensure a mock profile exists (once) when a domain is set but profile not yet streamed
  useEffect(() => {
    if (!profile && domain) {
      setProfile({
        name: domain.split('.')[0],
        domain,
        description: `Company at ${domain}`,
        ipoStatus: 'Unknown',
        socials: {},
      });
    }
  }, [profile, domain]);

  const analysisData: BriefingResponse | null = useMemo(() => {
    if (!profile) return null;

    const domains = [domain, ...competitors];
    // Attach news for main and competitors if available
    const newsByDomain = new Map<
      string,
      { headline: string; url: string; source: string }[]
    >();
    newsByDomain.set(
      domain,
      (companyNews || []).map((n) => ({
        headline: n.headline,
        url: n.url,
        source: n.source || "news",
      }))
    );
    for (const cn of competitorNews) {
      const list = newsByDomain.get(cn.domain) || [];
      list.push({
        headline: cn.headline,
        url: cn.url,
        source: cn.source || "news",
      });
      newsByDomain.set(cn.domain, list);
    }
    const benchmarkMatrix: BenchmarkMatrixItem[] =
      benchmark.length > 0
        ? benchmark.map((b) => ({
            domain: b.domain,
            pulseIndex: b.pulseIndex,
            narrativeMomentum: b.narrativeMomentum,
            sentimentScore: b.sentimentScore,
            historicalData: [],
            sentimentHistoricalData: b.sentimentHistoricalData,
            enhancedSentiment: b.enhancedSentiment, // NEW: propagate enhanced sentiment transparency payload
            news: (newsByDomain.get(b.domain) || []).map((n) => ({
              headline: n.headline,
              url: n.url,
              source: n.source,
              publishedDate: new Date().toISOString(),
              date: new Date().toISOString(),
              type: "Other",
            })),
          }))
        : domains.map((d) => ({
            domain: d,
            pulseIndex: 0,
            narrativeMomentum: 0,
            sentimentScore: 50,
            historicalData: [],
            news: [],
          }));

    const aiSummary: AiSummaryData = {
      groqTlDr: overview,
      summary: summaryText
        ? summaryText
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.startsWith("•") && l.length > 2)
            .slice(0, 3)
        : [],
    };

    return {
      requestDomain: domain,
      companyProfile: profile,
      founderInfo: (() => {
        // Basic heuristic: if any names contain CEO/CTO markers, pick them, else first two
        const augmented = founders.map((f) => ({
          orig: f,
          lower: f.name.toLowerCase(),
        }));
        const ceo = augmented.find((f) => /ceo/.test(f.lower))?.orig;
        const cto = augmented.find((f) => /cto/.test(f.lower))?.orig;
        let picked: typeof founders = [ceo, cto].filter(Boolean) as any;
        if (picked.length === 0) picked = founders.slice(0, 2);
        return picked;
      })(),
      benchmarkMatrix,
      newsFeed: companyNewsItems,
      aiSummary,
      className: 'briefing'
    };
  }, [
    profile,
    benchmark,
    overview,
    summaryText,
    domain,
    founders,
    competitors,
    companyNews,
    competitorNews,
    companyNewsItems,
  ]);

  const hasStarted = !!overview || isStreaming || !!domain;
  // Keep hero visible above analysis after start (scrollable)
  const showInlineHero = hasStarted;

  return (
  <div className="min-h-screen w-full bg-page-background text-white relative">
      <div
        className="absolute inset-0 z-0 opacity-50"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.1) 0%, rgba(15, 23, 42, 0.1) 35%, transparent 60%)`,
        }}
      />

      <div className="relative z-10">
        <Navbar />

  <main className="p-6 pt-10 md:pt-12">
          {showInlineHero && (
            <div id="hero-banner" className="mb-12 scroll-mt-24">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-5xl font-bold text-slate-50 tracking-tight mb-2">
                  Decode <span className="text-slate-300">Any Competitor</span>.
                  Instantly.
                </h1>
                <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
                  Stay oriented: scroll anytime to revisit your starting point
                  or launch a new analysis.
                </p>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="container mx-auto px-4 text-center"
              >
                <div className="w-full max-w-3xl mx-auto mb-4">
                  <AIInputWithSearch
                    placeholder="Try a different company URL..."
                    onSubmit={(value) => handleSearch(value)}
                    className="[& textarea]:h-10"
                  />
                </div>
                <div className="w-full max-w-3xl mx-auto mb-8">
                  <ExaUsageBanner compact />
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
                <div className="container mx-auto px-4 pt-4">
                  <div className="w-full max-w-3xl mx-auto mb-4">
                    <AIInputWithSearch
                      placeholder="Search for another company..."
                      onSubmit={(value) => handleSearch(value)}
                      className="[& textarea]:h-10"
                    />
                  </div>
                  <div className="w-full max-w-3xl mx-auto mb-8">
                    <ExaUsageBanner compact />
                  </div>

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

                  {activeView === "analysis" && (
                    <div className="space-y-6">
                      {/* Upper Section: primary + top competitors */}
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className={`flex-[1.15] min-w-[380px]`}>
                        <PrimarySentimentCard
                          row={benchmark[0] as any}
                          loading={isStreaming && !benchmark[0]}
                        />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {benchmark.slice(1, 4).map((row, i) => (
                            <CompetitorSentimentCard
                              key={row.domain + i}
                              row={row as any}
                              loading={
                                isStreaming && !row.sentimentHistoricalData
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {/* Lower Section: detailed + comparison + market + assistant */}
                      <div className="flex gap-5 items-stretch">
                        <div className="basis-[55%] flex">
                          <DetailedSentimentAnalysis
                            row={benchmark[0] as any}
                            loading={
                              isStreaming &&
                              !benchmark[0]?.sentimentHistoricalData
                            }
                          />
                        </div>
                        <div className="basis-[45%] flex">
                          {analysisData && (
                            <CompetitorSentimentComparison
                              data={analysisData} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeView === "overview" && analysisData && (
                    <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_2.7fr] gap-8 max-w-[1600px] mx-auto">
                      <div className="xl:sticky top-28 h-fit">
                        <CompanyOverviewCard
                          profile={analysisData.companyProfile}
                          founders={analysisData.founderInfo}
                          sentimentScore={
                            analysisData.benchmarkMatrix?.[0]?.sentimentScore
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-8">
                        <div>
                        <CompanyNewsGrid items={analysisData.newsFeed} />
                        </div>
                        <div>
                        <CompetitorNews 
                          competitors={(analysisData.benchmarkMatrix.slice(1).length ? analysisData.benchmarkMatrix.slice(1) : competitorRowsForOverview) as any}
                          isLoading={isStreaming && !analysisData.benchmarkMatrix.slice(1).some(r=> (r.news||[]).length)}
                        />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeView === "summary" && analysisData && (
                    <div className="mt-8">
                      <SummaryView
                        data={analysisData.aiSummary}
                        context={{
                          domain: analysisData.requestDomain,
                          description: analysisData.companyProfile.description,
                          sentiment:
                            analysisData.benchmarkMatrix?.[0]?.sentimentScore,
                          competitors: analysisData.benchmarkMatrix
                            .slice(1)
                            .map((c) => ({
                              domain: c.domain,
                              sentiment: c.sentimentScore,
                            })),
                        }}
                      />
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
                <div className="container mx-auto px-4 pt-20 pb-24 text-center flex flex-col items-center">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-50 tracking-tight mb-4">
                    <span className="relative inline-block">
                      Decode
                      <span className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-blue-500 to-purple-600" />
                    </span>{" "}
                    Any Competitor.{" "}
                    <span className="text-slate-300">Instantly.</span>
                  </h1>
                  <p className="mt-4 max-w-3xl mx-auto text-base md:text-lg text-slate-400 leading-relaxed">
                    <span className="text-slate-300 font-medium">
                      Drop any company URL.
                    </span>{" "}
                    Get Quick real-time competitive, market positioning,
                    sentiment analysis, and strategic insights within minutes.
                  </p>
                  <div className="mt-8 w-full max-w-3xl">
                    <AIInputWithSearch
                      placeholder="Enter any company URL to decode their market position... (e.g., stripe.com)"
                      onSubmit={(value) => handleSearch(value)}
                      className="[& textarea]:h-12 [& textarea]:text-base"
                    />
                    <ExaUsageBanner />

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                      <span className="text-slate-500">Try:</span>
                      {[
                        "openai.com",
                        "stripe.com",
                        "notion.so",
                        "figma.com",
                      ].map((example) => (
                        <button
                          key={example}
                          onClick={() => handleSearch(example)}
                          className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                    {resumePrompt && lastQuery && (
                      <div className="mt-6 text-xs text-slate-400 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">
                            Previous analysis:
                          </span>
                          <code className="bg-slate-800/70 px-2 py-1 rounded text-slate-300">
                            {lastQuery}
                          </code>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleSearch(lastQuery);
                              setResumePrompt(false);
                            }}
                            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => {
                              setResumePrompt(false);
                              setDomain("");
                            }}
                            className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
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
