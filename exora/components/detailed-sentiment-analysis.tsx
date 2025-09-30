"use client"
import type { BenchmarkMatrixItem } from "@/lib/types"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"

interface DetailedSentimentAnalysisProps {
  row?: BenchmarkMatrixItem
  loading?: boolean
}

export function DetailedSentimentAnalysis({ row, loading }: DetailedSentimentAnalysisProps) {
  const hist = row?.sentimentHistoricalData || []
  const chartData = hist.length ? hist.map(d => ({ date: d.date, Sentiment: d.sentiment, Mentions: d.mentions })) : Array.from({ length: 7 }).map((_, i) => ({ date: `Day ${i+1}`, Sentiment: row?.sentimentScore ?? 50, Mentions: 0 }))
  const avg = chartData.reduce((a,c)=>a+c.Sentiment,0)/chartData.length
  const enhanced = row?.enhancedSentiment
  const breakdown = enhanced?.breakdown

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 transition-colors relative">
      {loading && !hist.length && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="animate-pulse w-full h-full bg-gradient-to-b from-slate-800/40 to-slate-900/60" />
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{row?.domain || '—'} - Sentiment Analysis</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Avg Sentiment: {Math.round(avg)}/100</span>
            {loading && <span className="text-[10px]">streaming…</span>}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">Sentiment</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
            <span className="text-slate-400">Mentions</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} domain={[0,100]} />
            <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={11} tickLine={false} />
            <Tooltip contentStyle={{ background:'#0F172A', border:'1px solid rgba(255,255,255,0.1)', fontSize:12 }} cursor={{ stroke:'rgba(255,255,255,0.2)' }} />
            <Line yAxisId="left" type="monotone" dataKey="Sentiment" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line yAxisId="right" type="monotone" dataKey="Mentions" stroke="#34D399" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {enhanced && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-semibold text-white">Methodology</h4>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <Badge variant="secondary" className="bg-white/5">Source Cred: {breakdown?.sourceCredibility ?? '–'}</Badge>
            <Badge variant="secondary" className="bg-white/5">Recency: {breakdown?.recencyWeight ?? '–'}</Badge>
            <Badge variant="secondary" className="bg-white/5">Volume: {breakdown?.volumeScore ?? '–'}</Badge>
            <Badge variant="secondary" className="bg-white/5">Language: {breakdown?.languageIntensity ?? '–'}</Badge>
            <Badge variant="secondary" className="bg-white/5">Event: {breakdown?.eventImpact ?? '–'}</Badge>
            <Badge variant="secondary" className="bg-white/5">Trend: {breakdown?.trendDirection ?? '–'}</Badge>
            <Badge variant="secondary" className="bg-white/5">Confidence: {enhanced.confidence}%</Badge>
          </div>
          {enhanced.factors?.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-slate-300 mb-2">Key Factors</h5>
              <div className="flex flex-wrap gap-1.5">
                {enhanced.factors.slice(0,6).map((f,i)=>(<Badge key={i} className="bg-slate-800 text-[10px] font-normal">{f}</Badge>))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
