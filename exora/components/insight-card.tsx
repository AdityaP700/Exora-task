"use client"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { AreaMiniChart } from "./chart-components"
import { ArrowUp } from "lucide-react"

interface InsightCardProps {
  title: string
  source: string
  sentiment: "positive" | "negative" | "neutral"
  trend: "up" | "down" | "neutral"
  data: number[]
  sentimentData?: Array<{ date: string; sentiment: number; mentions: number }>
  sentimentScore?: number
  isSpotted?: boolean
  confidence?: number
}

export function InsightCard({
  title,
  source,
  sentiment,
  trend,
  data,
  sentimentData,
  sentimentScore = 50,
  isSpotted = false,
  confidence,
}: InsightCardProps) {

  const getChartColorVar = () => {
    if (sentiment === 'positive') return 'var(--chart-2)';
    if (sentiment === 'negative') return 'var(--chart-3)';
    return 'var(--chart-1)';
  }

  return (
    <Card className="bg-slate-900/50 border border-white/5 rounded-xl p-5 backdrop-blur-sm transition-all duration-200 hover:bg-slate-800/60 hover:border-cyan-400/20 group">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-white text-lg leading-tight">{title}</h3>
          {isSpotted && (
            <Badge variant="secondary" className="text-xs bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
              First Spotted
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 mb-4">{source}</p>

        {/* Chart */}
        <div className="flex-grow my-auto">
          <AreaMiniChart
            series={Array.isArray(data) ? data.map((v, i) => ({ label: String(i + 1), value: typeof v === 'number' ? v : 0 })) : []}
            sentimentData={sentimentData}
            colorVar={getChartColorVar()}
            height={80}
          />
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-400 capitalize">{trend} Trend</p>
            {confidence && (
              <Badge variant="outline" className="mt-1 text-xs border-white/10 text-slate-400">
                {Math.round(confidence * 100)}% confidence
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white flex items-center gap-1">
              {Math.round(sentimentScore)}
              <span className="text-lg text-slate-400">/100</span>
              <ArrowUp className="w-4 h-4 text-green-400" />
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}