// app/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import all our functional components and types
import { Navbar } from "@/components/layouts/navbar"; // The stunning navbar
import { AllInvestorView } from "@/components/all-investor-view";
import { TrendAnalysisView } from "@/components/trend-analysis-view";
import { AISidekickChat } from "@/components/ai-sidekick-chat";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import { BriefingResponse } from "@/lib/types";
import { Badge } from '@/components/ui/badge';
import { ArrowUp } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState("all-investor");

  const handleSearch = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    setBriefingData(null);

    try {
      // 🔧 FIXED: The fetch call is now extremely simple. No headers needed.
      const response = await fetch(`/api/briefing?domain=${domain}`);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || errData.error || "Failed to fetch briefing.");
      }
      const data: BriefingResponse = await response.json();
      setBriefingData(data);
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
                <DashboardSkeleton />
              </motion.div>
            ) : error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-red-400 mt-20 p-4">
                <h3 className="font-bold">An Error Occurred</h3>
                <p>{error}</p>
              </motion.div>
            ) : briefingData ? (
              // --- THE RESULTS DASHBOARD VIEW ---
              <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="container mx-auto px-4 mt-10">
                  {/* Tab Navigation for the Results */}
                   <div className="border-b border-slate-700/50 mb-6">
                        <nav className="flex gap-8">
                            <button onClick={() => setActiveTab('all-investor')} className={`py-2 px-1 text-sm font-medium transition-colors ${activeTab === 'all-investor' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}>
                                All Investor View
                            </button>
                            <button onClick={() => setActiveTab('trend-analysis')} className={`py-2 px-1 text-sm font-medium transition-colors ${activeTab === 'trend-analysis' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}>
                                Trend Analysis
                            </button>
                        </nav>
                    </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      {activeTab === "all-investor" && <AllInvestorView data={briefingData} />}
                      {activeTab === "trend-analysis" && <TrendAnalysisView data={briefingData} />}
                    </div>
                    <div className="lg:col-span-1">
                      <AISidekickChat data={briefingData.aiSummary} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              // --- THE INITIAL HERO SEARCH VIEW ---
              <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="container mx-auto px-4 pt-32 pb-24 text-center flex flex-col items-center">
                    <div className="flex justify-center gap-4 mb-8">
                        <Badge variant="outline" className="border-slate-700 bg-slate-900/50 backdrop-blur-sm py-2 px-4 text-slate-300">
                            Live on Peerlist Launchpad <ArrowUp className="w-4 h-4 ml-2"/>
                        </Badge>
                        <Badge variant="outline" className="border-slate-700 bg-slate-900/50 backdrop-blur-sm py-2 px-4 text-slate-300">
                            Featured on Product Hunt <ArrowUp className="w-4 h-4 ml-2"/>
                        </Badge>
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
                    
                    <div className="mt-12 w-full">
                        <AIInputWithSearch
                          placeholder="Enter a company URL to begin... (e.g., perplexity.ai)"
                          onSubmit={(value) => handleSearch(value)}
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