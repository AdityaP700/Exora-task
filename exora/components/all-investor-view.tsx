"use client"
import { InsightCard } from "./insight-card"
import { SentimentChart } from "./chart-components"
import type { BriefingResponse } from "@/lib/types"

type Props = { data: BriefingResponse }

export function AllInvestorView({ data }: Props) {
  const toSentiment = (score: number): "positive" | "negative" | "neutral" =>
    score > 60 ? "positive" : score < 40 ? "negative" : "neutral"

  const toTrend = (momentum: number): "up" | "down" | "neutral" =>
    momentum > 0 ? "up" : momentum < 0 ? "down" : "neutral"

  // Collective/aggregate metrics across all companies
  const avgSentiment = data.benchmarkMatrix.length
    ? data.benchmarkMatrix.reduce((s, r) => s + (r.sentimentScore ?? 0), 0) / data.benchmarkMatrix.length
    : 0
  const avgMomentum = data.benchmarkMatrix.length
    ? Math.round(
        data.benchmarkMatrix.reduce((s, r) => s + (r.narrativeMomentum ?? 0), 0) / data.benchmarkMatrix.length
      )
    : 0

  // Get the primary company (first in array) for detailed sentiment chart
  const primaryCompany = data.benchmarkMatrix[0]
  const primarySentimentData = (primaryCompany as any)?.sentimentHistoricalData || []
  
  return (
    <div className="space-y-6">
      {/* Top Row: Individual Company Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.benchmarkMatrix.map((item, index) => {
          const sentimentData = (item as any)?.sentimentHistoricalData || []
          const historicalMentions = (item as any)?.historicalData?.map((d: any) => d.mentions) ?? []
          
          return (
            <InsightCard
              key={index}
              title={item.domain}
              source="Exora Signals"
              sentiment={toSentiment(item.sentimentScore)}
              trend={toTrend(item.narrativeMomentum)}
              data={historicalMentions}
              sentimentData={sentimentData}
              sentimentScore={item.sentimentScore}
              isSpotted={index === 0}
              confidence={(item as any)?.enhancedSentiment?.confidence}
            />
          )
        })}
      </div>

      {/* Bottom Section: Detailed Analysis and Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {primaryCompany && primarySentimentData.length > 0 && (
            <SentimentChart
              title={`${primaryCompany.domain} - Sentiment Analysis`}
              data={primarySentimentData}
              sentimentScore={primaryCompany.sentimentScore}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          <InsightCard
            title="Market Sentiment Overview"
            source="Exora Composite"
            sentiment={toSentiment(avgSentiment)}
            trend={toTrend(avgMomentum)}
            data={data.benchmarkMatrix.map(item => item.sentimentScore ?? 0)}
            sentimentScore={avgSentiment}
            confidence={primaryCompany?.enhancedSentiment?.confidence}
          />
        </div>
      </div>
    </div>
  )
}