"use client"
import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AllInvestorView } from "@/components/all-investor-view"
import { TrendAnalysisView } from "@/components/trend-analysis-view"
import { CompetitorBarChart } from "@/components/competitor-bar-chart"
import { AISidekickChat } from "@/components/ai-sidekick-chat"
import type { BriefingResponse } from "@/lib/types"

type Props = { data: BriefingResponse }

export function AnalysisView({ data }: Props) {
  const [tab, setTab] = useState<"comparison" | "charts">("comparison")

  return (
    <div className="space-y-6">
      {/* Top: chart + side chat, like overview/news split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CompetitorBarChart data={data} title="Competitor Sentiment Comparison" subtitle="Sentiment, Pulse, Momentum" />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <AISidekickChat data={data.aiSummary} />
        </div>
      </div>

      {/* Below: competitor comparison */}
      <div className="flex items-center justify-center">
        <ToggleGroup value={tab} onValueChange={(v) => v && setTab(v as any)}>
          <ToggleGroupItem value="comparison" aria-label="Comparison">Comparison</ToggleGroupItem>
          <ToggleGroupItem value="charts" aria-label="Charts">Charts</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="space-y-6">
        {tab === "comparison" && <AllInvestorView data={data} />}
        {tab === "charts" && (
          <>
            <CompetitorBarChart data={data} />
            <TrendAnalysisView data={data} />
          </>
        )}
      </div>
    </div>
  )
}
