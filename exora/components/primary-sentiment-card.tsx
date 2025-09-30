"use client"

import { Badge } from "@/components/ui/badge"
import { AreaChart, Area, ResponsiveContainer } from "recharts"
import type { BenchmarkMatrixItem } from "@/lib/types"

interface PrimarySentimentCardProps {
  row?: BenchmarkMatrixItem
  loading?: boolean
}

export function PrimarySentimentCard({ row, loading }: PrimarySentimentCardProps) {
  const sentimentSeries = (row?.sentimentHistoricalData || []).map((d) => ({
    date: d.date,
    value: d.sentiment
  }))

  const fallbackSeries = sentimentSeries.length ? sentimentSeries : Array.from({ length: 7 }).map((_, i) => ({
    date: `${i}`,
    value: row?.sentimentScore ?? 50
  }))

  const confidence = row?.enhancedSentiment?.confidence
  const trend = (() => {
    if (!sentimentSeries.length) return 'Neutral'
    const first = sentimentSeries[0].value
    const last = sentimentSeries[sentimentSeries.length - 1].value
    if (last - first > 2) return 'Improving'
    if (first - last > 2) return 'Cooling'
    return 'Neutral'
  })()

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg flex-1 transition-all duration-300 ease-in-out hover:border-cyan-400/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white truncate max-w-[240px]">{row?.domain || '—'}</h3>
          <p className="text-xs text-slate-400">Exora Signals</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="text-[10px] bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">Primary</Badge>
          {confidence !== undefined && <Badge variant="outline" className="text-[10px] border-white/10 text-slate-400">{confidence}% conf</Badge>}
        </div>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fallbackSeries} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="primSentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.55}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#primSentGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-end mt-4">
        <div className="space-y-1">
          <p className="text-xs text-slate-400">{trend} Trend</p>
          {loading && <p className="text-[10px] text-slate-500">streaming…</p>}
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-white leading-none">{Math.round(row?.sentimentScore ?? 50)}<span className="text-sm text-slate-400">/100</span></p>
        </div>
      </div>
    </div>
  )
}
