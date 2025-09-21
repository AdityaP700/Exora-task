"use client"
import { InsightCard } from "./insight-card"

export function AllInvestorView() {
  const insightCards = [
    {
      title: "Quantum Leap AI Secure100 Series B Funding",
      source: "TechCrunch",
      sentiment: "positive" as const,
      trend: "up" as const,
      data: [10, 12, 14, 13, 15, 17, 16, 18, 20, 19, 21, 23],
      isFrontingInsight: true,
    },
    {
      title: "Metaverse Estate Bubble Concerns Rise",
      source: "TechCrunch",
      sentiment: "negative" as const,
      trend: "down" as const,
      data: [20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 1, 0],
      isSpotted: false,
    },
    {
      title: "Metaverse Estate Bubble Concerns",
      source: "TechCrunch",
      sentiment: "positive" as const,
      trend: "up" as const,
      data: [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27],
      isSpotted: false,
    },
    {
      title: "Global Supply Chain Post-Pandemic",
      source: "TechCrunch",
      sentiment: "negative" as const,
      trend: "down" as const,
      data: [25, 23, 21, 19, 17, 15, 13, 11, 9, 7, 5, 3],
      isSpotted: false,
    },
    {
      title: "Global Supply Resilience Post-Pandemic",
      source: "TechCrunch",
      sentiment: "neutral" as const,
      trend: "neutral" as const,
      data: [12, 13, 12, 14, 13, 15, 14, 16, 15, 17, 16, 18],
      isSpotted: false,
    },
    {
      title: "Global Supply Chain Post-Pandemic",
      source: "TechCrunch",
      sentiment: "positive" as const,
      trend: "up" as const,
      data: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      isFrontingInsight: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Time Range Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Last 24h</span>
          <span>/</span>
          <span>7d</span>
          <span>/</span>
          <span>30</span>
          <span>/</span>
          <span>All Time</span>
          <div className="w-32 h-1 bg-muted rounded-full relative ml-4">
            <div className="absolute left-1/4 top-0 w-2 h-2 bg-primary rounded-full transform -translate-y-0.5"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent"></div>
          <span className="text-sm text-muted-foreground">First Spotted!</span>
        </div>
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insightCards.map((card, index) => (
          <InsightCard
            key={index}
            title={card.title}
            source={card.source}
            sentiment={card.sentiment}
            trend={card.trend}
            data={card.data}
            isSpotted={card.isSpotted}
            isFrontingInsight={card.isFrontingInsight}
          />
        ))}
      </div>
    </div>
  )
}
