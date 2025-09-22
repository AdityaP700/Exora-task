"use client"
import { Card } from "./ui/card"
import { AreaChart as RAreaChart, Area, CartesianGrid, XAxis, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MiniChartProps {
  data: number[]
  color: string
  trend: "up" | "down" | "neutral"
  className?: string
}

export function MiniChart({ data, color, trend, className = "" }: MiniChartProps) {
  const safeData = Array.isArray(data) && data.length >= 2 ? data : [0, 0]
  const max = Math.max(...safeData)
  const min = Math.min(...safeData)
  const range = max - min
  const denom = safeData.length - 1 || 1

  const points = safeData
    .map((value, index) => {
      const x = (index / denom) * 100
      const y = range === 0 ? 50 : 100 - ((value - min) / (range || 1)) * 100
      const cx = Number.isFinite(x) ? x : 0
      const cy = Number.isFinite(y) ? y : 50
      return `${cx},${cy}`
    })
    .join(" ")

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const gradientId = `gradient-${String(color).replace(/[^a-zA-Z0-9_-]/g, "") || "color"}`

  return (
    <div className={`relative ${className}`}>
      <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} className="drop-shadow-sm" />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#${gradientId})`} points={`0,100 ${points} 100,100`} />
      </svg>
      <TrendIcon
        className={`absolute top-1 right-1 w-3 h-3 ${
          trend === "up" ? "text-chart-2" : trend === "down" ? "text-chart-3" : "text-muted-foreground"
        }`}
      />
    </div>
  )
}

interface SentimentChartProps {
  title: string
  data: { date: string; sentiment: number; mentions: number }[]
  sentimentScore?: number
}

export function SentimentChart({ title, data, sentimentScore = 50 }: SentimentChartProps) {
  const safeData = Array.isArray(data) && data.length >= 2 ? data : [
    { date: '0', sentiment: sentimentScore, mentions: 0 },
    { date: '1', sentiment: sentimentScore, mentions: 0 },
  ]

  const chartConfig: ChartConfig = {
    sentiment: { label: 'Sentiment', color: 'var(--chart-1)' },
    mentions: { label: 'Mentions', color: 'var(--chart-2)' },
  }

  const avgSentiment = safeData.reduce((acc, d) => acc + d.sentiment, 0) / safeData.length
  const trendDirection = safeData[safeData.length - 1]?.sentiment > safeData[0]?.sentiment ? 'up' : 
                        safeData[safeData.length - 1]?.sentiment < safeData[0]?.sentiment ? 'down' : 'neutral'

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              Avg Sentiment: {Math.round(avgSentiment)}/100
            </span>
            {trendDirection === 'up' && <TrendingUp className="w-4 h-4 text-chart-2" />}
            {trendDirection === 'down' && <TrendingDown className="w-4 h-4 text-chart-3" />}
            {trendDirection === 'neutral' && <Minus className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-1"></div>
            <span className="text-muted-foreground">Sentiment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-2"></div>
            <span className="text-muted-foreground">Mentions</span>
          </div>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-64">
        <ResponsiveContainer>
          <LineChart data={safeData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value)
                return isNaN(date.getTime()) ? value : date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
              }}
            />
            <YAxis 
              yAxisId="sentiment"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis 
              yAxisId="mentions"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <RTooltip 
              cursor={{ strokeWidth: 1, stroke: 'rgba(255,255,255,0.2)' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="text-sm font-medium">
                        {new Date(label).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </p>
                      {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                          {entry.dataKey === 'sentiment' ? 'Sentiment' : 'Mentions'}: {entry.value}
                          {entry.dataKey === 'sentiment' && '/100'}
                        </p>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Line 
              yAxisId="sentiment"
              type="monotone" 
              dataKey="sentiment" 
              stroke="var(--color-sentiment)" 
              strokeWidth={2} 
              dot={{ fill: 'var(--color-sentiment)', r: 4 }} 
              activeDot={{ r: 6, fill: 'var(--color-sentiment)' }}
            />
            <Line 
              yAxisId="mentions"
              type="monotone" 
              dataKey="mentions" 
              stroke="var(--color-mentions)" 
              strokeWidth={2} 
              dot={{ fill: 'var(--color-mentions)', r: 4 }} 
              activeDot={{ r: 6, fill: 'var(--color-mentions)' }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  )
}

// Updated AreaMiniChart with better sentiment representation
type AreaMiniChartProps = {
  series: Array<{ label: string; value: number }>
  colorVar?: string
  height?: number
  sentimentData?: Array<{ date: string; sentiment: number; mentions: number }>
}

export function AreaMiniChart({ series, colorVar = 'var(--chart-1)', height = 64, sentimentData }: AreaMiniChartProps) {
  // If we have sentiment data, use it; otherwise fall back to series
  const data = sentimentData?.length ? 
    sentimentData.map((d, i) => ({
      label: `Day ${i + 1}`,
      v: d.sentiment,
      mentions: d.mentions
    })) :
    (series && series.length ? series : [{ label: '', value: 0 }, { label: ' ', value: 0 }]).map((p) => ({
      label: p.label,
      v: typeof p.value === 'number' ? p.value : 0,
    }))

  const chartConfig: ChartConfig = {
    v: { label: 'Value', color: colorVar },
  }

  return (
    <ChartContainer config={chartConfig} className="w-full">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <RAreaChart data={data} margin={{ left: 4, right: 4, top: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" hide tickLine={false} axisLine={false} tickMargin={4} />
            <RTooltip 
              cursor={false} 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]?.payload
                  return (
                    <div className="bg-background border rounded p-2 text-xs">
                      <div>Sentiment: {Math.round(data?.v || 0)}/100</div>
                      {data?.mentions !== undefined && <div>Mentions: {data.mentions}</div>}
                    </div>
                  )
                }
                return null
              }}
            />
            <Area 
              dataKey="v" 
              type="monotone" 
              fill="var(--color-v)" 
              fillOpacity={0.25} 
              stroke="var(--color-v)" 
              strokeWidth={2} 
              dot={false} 
            />
          </RAreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

// Legacy LargeChart kept for backward compatibility
interface LargeChartProps {
  title: string
  data: { time: string; frequency: number; sentiment: number }[]
  timeRange: string
}

export function LargeChart({ title, data, timeRange }: LargeChartProps) {
  const safeData = Array.isArray(data) && data.length >= 2 ? data : [
    { time: '0', frequency: 0, sentiment: 50 },
    { time: '1', frequency: 0, sentiment: 50 },
  ]
  const maxFreq = Math.max(...safeData.map((d) => d.frequency), 0)
  const maxSent = Math.max(...safeData.map((d) => d.sentiment), 1)

  const denom = (safeData.length - 1) || 1

  const frequencyPoints = safeData
    .map((d, i) => {
      const x = (i / denom) * 100
      const y = maxFreq === 0 ? 90 : 100 - (d.frequency / (maxFreq || 1)) * 80
      const cx = Number.isFinite(x) ? x : 0
      const cy = Number.isFinite(y) ? y : 90
      return `${cx},${cy}`
    })
    .join(" ")

  const sentimentPoints = safeData
    .map((d, i) => {
      const x = (i / denom) * 100
      const y = maxSent === 0 ? 50 : 100 - (d.sentiment / (maxSent || 1)) * 80
      const cx = Number.isFinite(x) ? x : 0
      const cy = Number.isFinite(y) ? y : 50
      return `${cx},${cy}`
    })
    .join(" ")

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-1"></div>
            <span className="text-muted-foreground">Frequency & Sentiment Over Time</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgb(52, 73, 94)" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Sentiment area */}
          <defs>
            <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2ecc71" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2ecc71" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polygon fill="url(#sentimentGradient)" points={`0,100 ${sentimentPoints} 100,100`} />

          {/* Frequency area */}
          <defs>
            <linearGradient id="frequencyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3498db" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3498db" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polygon fill="url(#frequencyGradient)" points={`0,100 ${frequencyPoints} 100,100`} />

          {/* Lines */}
          <polyline fill="none" stroke="#2ecc71" strokeWidth="2" points={sentimentPoints} />
          <polyline fill="none" stroke="#3498db" strokeWidth="2" points={frequencyPoints} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-2">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Sentiment & Frequency Analysis</span>
        </div>
        <span className="text-sm text-muted-foreground">{timeRange}</span>
      </div>
    </Card>
  )
}