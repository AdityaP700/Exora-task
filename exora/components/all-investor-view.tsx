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
      {/* Primary Company Detailed Sentiment Chart */}
      {primaryCompany && primarySentimentData.length > 0 && (
        <div className="mb-6">
          <SentimentChart
            title={`${primaryCompany.domain} - Sentiment Analysis`}
            data={primarySentimentData}
            sentimentScore={primaryCompany.sentimentScore}
          />
        </div>
      )}

      {/* Collective Sentiment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard
          title="Market Sentiment Overview"
          source="Exora Composite"
          sentiment={toSentiment(avgSentiment)}
          trend={toTrend(avgMomentum)}
          data={data.benchmarkMatrix.map(item => item.sentimentScore ?? 0)}
          sentimentScore={avgSentiment}
        />
      </div>

      {/* Individual Company Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              isSpotted={index === 0} // Mark primary company as "First Spotted"
              isFrontingInsight={item.sentimentScore > 70} // Mark high-sentiment companies
            />
          )
        })}
      </div>

      {/* Executive Summary Section */}
      {data.aiSummary && (
        <div className="mt-8">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Executive Summary</h3>
            <div className="space-y-3">
              {data.aiSummary.summary.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {point.replace(/^•\s*/, '')}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Company Overview:</strong> {data.aiSummary.groqTlDr}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}