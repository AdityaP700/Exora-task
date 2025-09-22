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
