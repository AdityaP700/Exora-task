"use client"
import { Card } from "./ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MiniChartProps {
  data: number[]
  color: string
  trend: "up" | "down" | "neutral"
  className?: string
}

export function MiniChart({ data, color, trend, className = "" }: MiniChartProps) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    .join(" ")

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  return (
    <div className={`relative ${className}`}>
      <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} className="drop-shadow-sm" />
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#gradient-${color})`} points={`0,100 ${points} 100,100`} />
      </svg>
      <TrendIcon
        className={`absolute top-1 right-1 w-3 h-3 ${
          trend === "up" ? "text-chart-2" : trend === "down" ? "text-chart-3" : "text-muted-foreground"
        }`}
      />
    </div>
  )
}

interface LargeChartProps {
  title: string
  data: { time: string; frequency: number; sentiment: number }[]
  timeRange: string
}

export function LargeChart({ title, data, timeRange }: LargeChartProps) {
  const maxFreq = Math.max(...data.map((d) => d.frequency))
  const maxSent = Math.max(...data.map((d) => d.sentiment))

  const frequencyPoints = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - (d.frequency / maxFreq) * 80
      return `${x},${y}`
    })
    .join(" ")

  const sentimentPoints = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - (d.sentiment / maxSent) * 80
      return `${x},${y}`
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
          <span>20%</span>
          <span>15%</span>
          <span>10%</span>
          <span>5%</span>
          <span>0</span>
        </div>
      </div>

      {/* Time controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Last 24h</span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">30</span>
          <div className="w-32 h-1 bg-muted rounded-full relative">
            <div className="absolute left-1/3 top-0 w-2 h-2 bg-primary rounded-full transform -translate-y-0.5"></div>
          </div>
          <span className="text-sm text-muted-foreground">All Time</span>
        </div>
        <span className="text-sm text-muted-foreground">{timeRange}</span>
      </div>
    </Card>
  )
}
