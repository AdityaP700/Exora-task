"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { AISidekickChat } from "@/components/ai-sidekick-chat"
import { TrendAnalysisView } from "@/components/trend-analysis-view"
import { AllInvestorView } from "@/components/all-investor-view"
import { BriefingResponse } from "@/lib/types"; // Import your API contract
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search"

// A component for the initial search screen
function InitialSearchView({ onSearch }: { onSearch: (domain: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">Strategic Briefing Engine</h1>
      <p className="text-muted-foreground max-w-md">
        Enter a company domain for detailed research info. Instantly know any company inside out.
      </p>
      <AIInputWithSearch
        placeholder="Enter Company URL (e.g., perplexity.ai)"
        onSubmit={(value /*, withSearch*/ ) => onSearch(value)}
        className="w-full"
      />
    </div>
  );
}

export default function Dashboard() {
  // Preserve original state management
  const [activeTab, setActiveTab] = useState("trend-analysis")
  const [showSearch, setShowSearch] = useState(false)
  
  // Add enhanced state management from suggested code
  const [briefingData, setBriefingData] = useState<BriefingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    setBriefingData(null);

    // NOTE: Implement BYOK by getting keys from localStorage here
    const exaApiKey = localStorage.getItem('exa_api_key');
    const groqApiKey = localStorage.getItem('groq_api_key');
    const openAiApiKey = localStorage.getItem('openai_api_key');
    const geminiApiKey = localStorage.getItem('gemini_api_key');

    try {
      const response = await fetch(`/api/briefing?domain=${domain}`, {
        headers: {
          'x-exa-api-key': exaApiKey || '',
          'x-groq-api-key': groqApiKey || '',
          'x-openai-api-key': openAiApiKey || '',
          'x-gemini-api-key': geminiApiKey || '',
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch briefing");
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
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <DashboardHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showSearch={showSearch}
            onSearchToggle={() => setShowSearch(!showSearch)}
          />

          <main className="flex-1 p-6 overflow-auto">
            {/* Loading and Error States */}
            {isLoading && <div>Loading...</div> /* Replace with Skeleton Loader */}
            {error && <div className="text-red-500">Error: {error}</div>}
            
            {/* Initial Search View - Show when no data is loaded */}
            {!isLoading && !briefingData && <InitialSearchView onSearch={handleSearch} />}
            
            {/* Data Views - Show when briefing data is available */}
            {briefingData && (
              <>
                {activeTab === "trend-analysis" && <TrendAnalysisView data={briefingData} />}
                {activeTab === "all-investor" && <AllInvestorView data={briefingData} />}
              </>
            )}
          </main>
        </div>

        {/* AI Sidekick Chat - Conditionally render based on briefing data availability */}
        {briefingData ? (
          <AISidekickChat data={briefingData.aiSummary} />
        ) : (
          <AISidekickChat />
        )}
      </div>
    </div>
  )
}
