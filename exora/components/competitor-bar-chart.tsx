"use client"
import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import type { BriefingResponse } from "@/lib/types"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type Props = { data: BriefingResponse; title?: string; subtitle?: string }

export function CompetitorBarChart({ data, title = "Market Positioning: Peer Metric Comparison", subtitle = "Sentiment • Pulse • Narrative Momentum" }: Props) {
  const [mode, setMode] = useState<"grouped" | "stacked">("grouped")

  // Build chart rows: one per company
  const rows = useMemo(() => {
    return data.benchmarkMatrix.map((row) => ({
      company: row.domain,
      sentiment: Number.isFinite(row.sentimentScore) ? Math.round(row.sentimentScore) : 0,
      pulse: Number.isFinite(row.pulseIndex) ? Math.round(row.pulseIndex) : 0,
      momentum: Number.isFinite(row.narrativeMomentum) ? Math.round(row.narrativeMomentum) : 0,
    }))
  }, [data])

  const chartConfig: ChartConfig = {
    sentiment: { label: "Sentiment", color: "hsl(var(--chart-2))" },
    pulse: { label: "Pulse", color: "hsl(var(--chart-1))" },
    momentum: { label: "Momentum", color: "hsl(var(--chart-3))" },
  }

  const stackId = mode === "stacked" ? "a" : undefined

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-2xl font-bold text-slate-50">{title}</CardTitle>
          <CardDescription className="text-slate-400">{subtitle}</CardDescription>
        </div>
        <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as any)}>
          <ToggleGroupItem value="grouped" aria-label="Grouped">Grouped</ToggleGroupItem>
          <ToggleGroupItem value="stacked" aria-label="Stacked">Stacked</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-sm text-slate-400">No competitor metrics available.</div>
        ) : (
          <ChartContainer config={chartConfig}>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} accessibilityLayer barGap={8} barCategoryGap={16}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="company" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={4} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                  <Legend />
                  <Bar name="Sentiment" dataKey="sentiment" fill="var(--color-sentiment)" radius={4} stackId={stackId} />
                  <Bar name="Pulse" dataKey="pulse" fill="var(--color-pulse)" radius={4} stackId={stackId} />
                  <Bar name="Momentum" dataKey="momentum" fill="var(--color-momentum)" radius={4} stackId={stackId} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
