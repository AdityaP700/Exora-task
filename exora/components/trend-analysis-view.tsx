"use client"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { LargeChart, MiniChart } from "./chart-components"

export function TrendAnalysisView() {
  // Mock data for the main chart
  const mainChartData = [
    { time: "1:00", frequency: 15, sentiment: 12 },
    { time: "13:15", frequency: 14, sentiment: 13 },
    { time: "1:00", frequency: 16, sentiment: 14 },
    { time: "7:00", frequency: 15, sentiment: 15 },
    { time: "90", frequency: 17, sentiment: 16 },
    { time: "00", frequency: 18, sentiment: 17 },
    { time: "90", frequency: 19, sentiment: 18 },
    { time: "12:00", frequency: 20, sentiment: 19 },
    { time: "15:00", frequency: 18, sentiment: 20 },
  ]

  // Mock data for comparison cards
  const quantumData = [12, 14, 13, 15, 14, 16, 15, 17, 16, 18, 17, 19]
  const metaverseData = [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7]

  return (
    <div className="space-y-6">
      {/* Main Chart */}
      <LargeChart title="Frequency & Sentiment Over Time" data={mainChartData} timeRange="Last 90 Days" />

      {/* Trend Comparison Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Trend Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quantum Leap AI Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Quantum Leap AI Post-Concerns</h4>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    <div className="w-2 h-2 rounded-full bg-chart-2 mr-1"></div>
                    Frequency: +15%
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <div className="w-2 h-2 rounded-full bg-chart-2 mr-1"></div>
                    Positive 15%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <div className="w-2 h-2 rounded-full bg-chart-1"></div>
                  <span>Sentiment Positive</span>
                  <div className="w-2 h-2 rounded-full bg-chart-3 ml-4"></div>
                  <span>Negative Trend</span>
                </div>
              </div>

              <MiniChart data={quantumData} color="#3498db" trend="up" className="h-16" />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>1w 1h</span>
                <span>1w 10</span>
                <span>28th</span>
                <span>29th</span>
              </div>
            </div>
          </Card>

          {/* Metaverse Estate Bubble Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Metaverse Estate Bubble Post-Pandemic</h4>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    <div className="w-2 h-2 rounded-full bg-chart-3 mr-1"></div>
                    Frequency: +35%
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <div className="w-2 h-2 rounded-full bg-chart-3 mr-1"></div>
                    Negative Shift
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <div className="w-2 h-2 rounded-full bg-chart-1"></div>
                  <span>Sentiment Trend</span>
                  <div className="w-2 h-2 rounded-full bg-chart-3 ml-4"></div>
                  <span>Negative Trend</span>
                </div>
              </div>

              <MiniChart data={metaverseData} color="#e74c3c" trend="down" className="h-16" />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>1w 10</span>
                <span>1w 10</span>
                <span>20th</span>
                <span>29th</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
