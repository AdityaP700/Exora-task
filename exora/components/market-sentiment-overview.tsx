"use client"

import { Badge } from "@/components/ui/badge"
import { AreaChart, Area, ResponsiveContainer } from "recharts"
import { Sparkles } from "lucide-react"

const data = [
  { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];

export function MarketSentimentOverview() {
  return (
    <div className="bg-gradient-to-br from-gradient-start to-gradient-end rounded-2xl p-7 text-white transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6" />
        <div>
          <h3 className="text-lg font-semibold">Market Sentiment Overview</h3>
          <p className="text-sm opacity-80">Exora Composite</p>
        </div>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorUvMarket" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(255,255,255,0.4)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="rgba(255,255,255,0.4)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="uv" stroke="rgba(255,255,255,0.6)" strokeWidth={2} fill="url(#colorUvMarket)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">Neutral Trend</span>
          <Badge variant="outline" className="text-xs border-white/50 text-white">41% confidence</Badge>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-4xl font-bold">50/100</p>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-accent-green" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L6.03 8.78a.75.75 0 01-1.06-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  )
}
