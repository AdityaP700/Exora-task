"use client"
import { InsightCard } from "./insight-card"
import { Card } from "./ui/card"
import { Info } from 'lucide-react'
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
  const enhanced = (primaryCompany as any)?.enhancedSentiment

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

      {/* Sentiment Model Explainer (if enhanced info available) */}
      {enhanced && (
        <Card className="p-4 border border-slate-800 bg-slate-900/40">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 mt-0.5" />
            <div className="space-y-2 text-sm">
              <div className="font-medium text-slate-200">How this sentiment score is derived</div>
              <p className="text-slate-400 leading-relaxed">
                Overall sentiment ({enhanced.overallScore}/100, confidence {enhanced.confidence}%) blends: source credibility, recency, volume vs peers, language intensity, event impact, and momentum trend.
              </p>
              <ul className="grid sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-500">
                <li>Source Credibility: {enhanced.breakdown.sourceCredibility}</li>
                <li>Recency Weight: {enhanced.breakdown.recencyWeight}</li>
                <li>Volume Score: {enhanced.breakdown.volumeScore}</li>
                <li>Language Intensity: {enhanced.breakdown.languageIntensity}</li>
                <li>Event Impact: {enhanced.breakdown.eventImpact}</li>
                <li>Trend: {enhanced.breakdown.trendDirection}</li>
              </ul>
              {enhanced.factors?.length > 0 && (
                <div className="pt-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Key Factors</div>
                  <div className="flex flex-wrap gap-2">
                    {enhanced.factors.slice(0,6).map((f: string, i: number) => (
                      <span key={i} className="px-2 py-1 rounded-full bg-slate-800/60 text-slate-300 text-[11px]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
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
          confidence={primaryCompany?.enhancedSentiment?.confidence}
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
              confidence={(item as any)?.enhancedSentiment?.confidence}
            />
          )
        })}
      </div>

      {/* Executive Summary Section */}
      
    </div>
  )
}