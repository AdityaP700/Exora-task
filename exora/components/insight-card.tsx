"use client"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { AreaMiniChart } from "./chart-components"
import { TrendingUp, TrendingDown, Zap } from "lucide-react"

interface InsightCardProps {
  title: string
  source: string
  sentiment: "positive" | "negative" | "neutral"
  trend: "up" | "down" | "neutral"
  data: number[]
  sentimentData?: Array<{ date: string; sentiment: number; mentions: number }>
  sentimentScore?: number
  isSpotted?: boolean
  isFrontingInsight?: boolean
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
  isFrontingInsight = false,
}: InsightCardProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-chart-2 text-white"
      case "negative":
        return "bg-chart-3 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-chart-2" />
      case "down":
        return <TrendingDown className="w-3 h-3 text-chart-3" />
      default:
        return null
    }
  }

  const getChartColorVar = (sentiment: string) =>
    sentiment === 'positive' ? 'var(--chart-2)' : sentiment === 'negative' ? 'var(--chart-3)' : 'var(--chart-1)'

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-foreground text-sm leading-tight pr-2">{title}</h3>
          {isSpotted && (
            <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground">
              First Spotted!
            </Badge>
          )}
          {isFrontingInsight && (
            <Badge variant="secondary" className="text-xs bg-chart-2 text-white">
              <Zap className="w-3 h-3 mr-1" />
              Fronting Insight
            </Badge>
          )}
        </div>

        {/* Source */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium">ES</span>
          </div>
          <span>Source: {source}</span>
        </div>

        {/* Chart with Sentiment Data */}
        <div className="relative">
          <AreaMiniChart
            series={Array.isArray(data) ? data.map((v, i) => ({ label: String(i + 1), value: typeof v === 'number' ? v : 0 })) : []}
            sentimentData={sentimentData}
            colorVar={getChartColorVar(sentiment)}
            height={64}
          />
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${getSentimentColor(sentiment)}`}>
              {sentiment === "positive"
                ? "Positive Growth"
                : sentiment === "negative"
                  ? "Negative Trend"
                  : "Neutral Trend"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">{getTrendIcon(trend)}</div>
        </div>

        {/* Sentiment Score Display */}
        <div className="text-xs text-muted-foreground flex justify-between items-center">
          <span>Sentiment Score</span>
          <span className="font-medium">{Math.round(sentimentScore)}/100</span>
        </div>
      </div>
    </Card>
  )
}