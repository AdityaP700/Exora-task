"use client"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { LargeChart, MiniChart } from "./chart-components"
import type { BriefingResponse } from "@/lib/types"

type Props = { data: BriefingResponse }

export function TrendAnalysisView({ data }: Props) {
  const primary = data.benchmarkMatrix[0]

  // Transform historicalData to the LargeChart format
  const mainChartData = (primary as any).historicalData?.map((d: any, i: number) => ({
    time: d.date || String(i),
    frequency: d.mentions ?? 0,
    sentiment: Math.max(0, Math.min(100, primary.sentimentScore)) // reuse sentiment level as overlay
  })) ?? []

  return (
    <div className="space-y-6">
      {/* Main Chart */}
      <LargeChart title="Frequency & Sentiment Over Time" data={mainChartData} timeRange="Last 90 Days" />

      {/* Trend Comparison Section (kept for layout parity; could be wired similarly later) */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Trend Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Example comparison using first two competitors if available */}
          {data.benchmarkMatrix.slice(1, 3).map((row, idx) => {
            const series = (row as any).historicalData?.map((d: any) => d.mentions) ?? []
            const trend: "up" | "down" | "neutral" = row.narrativeMomentum > 0 ? "up" : row.narrativeMomentum < 0 ? "down" : "neutral"
            const color = trend === 'up' ? '#3498db' : trend === 'down' ? '#e74c3c' : '#95a5a6'
            return (
              <Card className="p-6" key={`${row.domain}-${idx}`}>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{row.domain}</h4>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        <div className="w-2 h-2 rounded-full bg-chart-2 mr-1"></div>
                        Mentions
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <div className="w-2 h-2 rounded-full bg-chart-2 mr-1"></div>
                        Sentiment {Math.round(row.sentimentScore)}
                      </Badge>
                    </div>
                  </div>

                  <MiniChart data={series} color={color} trend={trend} className="h-16" />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Start</span>
                    <span>Mid</span>
                    <span>End</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
