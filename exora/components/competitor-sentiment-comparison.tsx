"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const data = [
  { name: 'aramco.com', Sentiment: 400, Pulse: 240, Momentum: 180 },
  { name: 'exxonmobil.com', Sentiment: 300, Pulse: 139, Momentum: 120 },
  { name: 'shell.com', Sentiment: 200, Pulse: 580, Momentum: 400 },
  { name: 'bp.com', Sentiment: 278, Pulse: 390, Momentum: 350 },
];

export function CompetitorSentimentComparison() {
  return (
    <div className="bg-card-secondary rounded-xl p-8 border border-white/10 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Competitor Sentiment Comparison</h3>
          <p className="text-sm text-muted-foreground">Sentiment, Pulse, Momentum</p>
        </div>
        <ToggleGroup type="single" defaultValue="grouped" size="sm">
          <ToggleGroupItem value="grouped">Grouped</ToggleGroupItem>
          <ToggleGroupItem value="stacked">Stacked</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 600]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#F8FAFC'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '14px', color: '#94A3B8' }} />
            <Bar dataKey="Sentiment" fill="#3B82F6" />
            <Bar dataKey="Pulse" fill="#818CF8" />
            <Bar dataKey="Momentum" fill="#A78BFA" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
