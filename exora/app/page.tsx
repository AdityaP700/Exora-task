"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { AISidekickChat } from "@/components/ai-sidekick-chat"
import { TrendAnalysisView } from "@/components/trend-analysis-view"
import { AllInvestorView } from "@/components/all-investor-view"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("trend-analysis")
  const [showSearch, setShowSearch] = useState(false)

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
            {activeTab === "trend-analysis" && <TrendAnalysisView />}
            {activeTab === "all-investor" && <AllInvestorView />}
          </main>
        </div>

        {/* AI Sidekick Chat */}
        <AISidekickChat />
      </div>
    </div>
  )
}
