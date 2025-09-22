// app/briefing/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

// Import all your functional components
import { DashboardHeader } from "../../components/dashboard-header";
import { AISidekickChat } from "../../components/ai-sidekick-chat";
import { TrendAnalysisView } from "../../components/trend-analysis-view";
import { AllInvestorView } from "../../components/all-investor-view";

// Import state management and types
import { useApiKeyStore } from "../../lib/store";
import { BriefingResponse } from "../../lib/types";

// A simple but effective skeleton loader
function DashboardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="space-y-6">
                <div className="h-64 bg-slate-800/50 rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="h-48 bg-slate-800/50 rounded-lg"></div>
                    <div className="h-48 bg-slate-800/50 rounded-lg"></div>
                    <div className="h-48 bg-slate-800/50 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
}

function BriefingPageContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain');
  
  const [activeTab, setActiveTab] = useState("all-investor");
  const [briefingData, setBriefingData] = useState<BriefingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get state and actions from the Zustand store for BYOK
  const { exaApiKey, groqApiKey, geminiApiKey, openAiApiKey, openModal } = useApiKeyStore();

  useEffect(() => {
    const handleSearch = async (domainToSearch: string) => {
      if (!exaApiKey) {
        setError("Exa API Key is required. Please add it in settings to proceed.");
        openModal();
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setBriefingData(null);

      try {
        const response = await fetch(`/api/briefing?domain=${domainToSearch}`, {
          headers: {
            'x-exa-api-key': exaApiKey,
            'x-groq-api-key': groqApiKey,
            'x-gemini-api-key': geminiApiKey,
            'x-openai-api-key': openAiApiKey,
          }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.details || errData.error || "Failed to fetch briefing data.");
        }

        const data: BriefingResponse = await response.json();
        setBriefingData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (domain) {
      handleSearch(domain);
    } else {
        setError("No company domain provided. Please start a search from the home page.");
        setIsLoading(false);
    }
  }, [domain, exaApiKey, groqApiKey, geminiApiKey, openAiApiKey, openModal]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 p-6 overflow-auto">
            {isLoading && <DashboardSkeleton />}
            {error && !isLoading && (
              <div className="text-center text-red-400 mt-10 p-4 bg-red-900/20 rounded-lg">
                <h3 className="font-bold">An Error Occurred</h3>
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {briefingData && !isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {activeTab === "all-investor" && <AllInvestorView data={briefingData} />}
                  {activeTab === "trend-analysis" && <TrendAnalysisView data={briefingData} />}
                </div>
                <div className="lg:col-span-1">
                  <AISidekickChat data={briefingData.aiSummary} />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function BriefingPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen text-white">Loading Briefing...</div>}>
            <BriefingPageContent />
        </Suspense>
    );
}