"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"

const data = [
  { date: 'Sep 21', Sentiment: 50, Mentions: 20 },
  { date: 'Sep 22', Sentiment: 55, Mentions: 25 },
  { date: 'Sep 23', Sentiment: 53, Mentions: 22 },
  { date: 'Sep 24', Sentiment: 58, Mentions: 30 },
  { date: 'Sep 25', Sentiment: 60, Mentions: 35 },
  { date: 'Sep 26', Sentiment: 57, Mentions: 28 },
  { date: 'Sep 27', Sentiment: 59, Mentions: 32 },
];

export function DetailedSentimentAnalysis() {
  return (
    <div className="bg-card-secondary rounded-xl p-8 border border-white/10 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">aramco.com - Sentiment Analysis</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Avg Sentiment: 53/100</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent-green" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L6.03 8.78a.75.75 0 01-1.06-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-blue"></div>
            <span>Sentiment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-green"></div>
            <span>Mentions</span>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
            <YAxis yAxisId="left" stroke="#94A3B8" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#F8FAFC'
              }}
            />
            <Legend wrapperStyle={{ color: '#94A3B8' }} />
            <Line yAxisId="left" type="monotone" dataKey="Sentiment" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line yAxisId="right" type="monotone" dataKey="Mentions" stroke="#34D399" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-muted-foreground" />
          <h4 className="text-md font-semibold text-white">How this sentiment score is derived</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          The sentiment score is a weighted average of multiple factors, including source credibility, recency of mentions, volume of discussion, language intensity, and the impact of specific events.
        </p>
        <div className="flex flex-wrap gap-4 mb-6">
          <Badge variant="secondary">Source Credibility: 0</Badge>
          <Badge variant="secondary">Recency Weight: 77</Badge>
          <Badge variant="secondary">Volume Score: 100</Badge>
          <Badge variant="secondary">Language Intensity: 25</Badge>
          <Badge variant="secondary">Event Impact: 43</Badge>
          <Badge variant="secondary">Trend: improving</Badge>
        </div>
        <div>
          <h5 className="text-sm font-semibold text-white mb-3">Key Factors</h5>
          <div className="flex flex-wrap gap-3">
            <Badge>Recent coverage concentration</Badge>
            <Badge>Above-peer mention volume</Badge>
            <Badge>Negative or cautionary event impact</Badge>
            <Badge>Momentum trending upward</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
