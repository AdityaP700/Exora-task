"use client"
import type { BenchmarkMatrixItem } from "@/lib/types"
import { AreaChart, Area, ResponsiveContainer } from "recharts"

interface CompetitorSentimentCardProps {
  row?: BenchmarkMatrixItem
  loading?: boolean
}

export function CompetitorSentimentCard({ row, loading }: CompetitorSentimentCardProps) {
  const sentimentSeries = (row?.sentimentHistoricalData || []).map(d => ({ date: d.date, value: d.sentiment }))
  const fallbackSeries = sentimentSeries.length ? sentimentSeries : Array.from({ length: 7 }).map((_, i) => ({ date: `${i}`, value: row?.sentimentScore ?? 50 }))
  const trend = (() => {
    if (!sentimentSeries.length) return 'Neutral'
    const first = sentimentSeries[0].value
    const last = sentimentSeries[sentimentSeries.length - 1].value
    if (last - first > 2) return 'Improving'
    if (first - last > 2) return 'Cooling'
    return 'Neutral'
  })()

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-5 border border-white/10 shadow flex flex-col transition-all duration-300 hover:border-cyan-400/20">
      <div className="flex items-start justify-between mb-2">
  <h4 className="text-sm font-semibold text-white truncate max-w-full">{row?.domain || '—'}</h4>
        {loading && <span className="text-[10px] text-slate-500">…</span>}
      </div>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fallbackSeries} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="compSentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area dataKey="value" type="monotone" stroke="#3B82F6" strokeWidth={1.5} fill="url(#compSentGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-end justify-between mt-3">
        <p className="text-[10px] text-slate-400">{trend}</p>
        <p className="text-sm font-medium text-white leading-none">{Math.round(row?.sentimentScore ?? 50)}<span className="text-[10px] text-slate-400">/100</span></p>
      </div>
    </div>
  )
}
