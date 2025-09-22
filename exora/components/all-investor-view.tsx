"use client"
import { InsightCard } from "./insight-card"
import type { BriefingResponse } from "@/lib/types"

type Props = { data: BriefingResponse }

export function AllInvestorView({ data }: Props) {
  const toSentiment = (score: number): "positive" | "negative" | "neutral" =>
    score > 60 ? "positive" : score < 40 ? "negative" : "neutral"

  const toTrend = (momentum: number): "up" | "down" | "neutral" =>
    momentum > 0 ? "up" : momentum < 0 ? "down" : "neutral"

  return (
    <div className="space-y-6">
      {/* Time Range Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Last 24h</span>
          <span>/</span>
          <span>7d</span>
          <span>/</span>
          <span>30</span>
          <span>/</span>
          <span>All Time</span>
          <div className="w-32 h-1 bg-muted rounded-full relative ml-4">
            <div className="absolute left-1/4 top-0 w-2 h-2 bg-primary rounded-full transform -translate-y-0.5"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent"></div>
          <span className="text-sm text-muted-foreground">First Spotted!</span>
        </div>
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.benchmarkMatrix.map((item, index) => (
          <InsightCard
            key={index}
            title={item.domain}
            source={"Exora Signals"}
            sentiment={toSentiment(item.sentimentScore)}
            trend={toTrend(item.narrativeMomentum)}
            data={(item as any).historicalData?.map((d: any) => d.mentions) ?? []}
            // Optional flags left off; could infer based on ranking if desired
          />
        ))}
      </div>
    </div>
  )
}
