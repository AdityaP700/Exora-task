"use client"
import type { BriefingResponse, BenchmarkMatrixItem } from "@/lib/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useState, useMemo } from 'react'

interface Props { data: BriefingResponse; limit?: number }

export function CompetitorSentimentComparison({ data, limit = 6 }: Props) {
  const [mode, setMode] = useState<'grouped'|'stacked'>('grouped')

  const rows: BenchmarkMatrixItem[] = (data.benchmarkMatrix || []).slice(0, limit)

  const chartData = useMemo(() => {
    return rows.map(r => ({
      name: r.domain,
      Sentiment: r.sentimentScore ?? 0,
      Pulse: r.pulseIndex ?? 0,
      Momentum: r.narrativeMomentum ?? 0
    }))
  }, [rows])

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 relative flex flex-col h-full">
      {rows.length === 0 && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="animate-pulse w-full h-full bg-gradient-to-b from-slate-800/40 to-slate-900/60" />
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Competitor Sentiment Comparison</h3>
          <p className="text-xs text-slate-400">Sentiment, Pulse, Momentum</p>
        </div>
  <ToggleGroup type="single" value={mode} onValueChange={(v)=> v && setMode(v as any)}>
          <ToggleGroupItem value="grouped">Grouped</ToggleGroupItem>
          <ToggleGroupItem value="stacked">Stacked</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="h-72 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
            <Tooltip contentStyle={{ background:'#0F172A', border:'1px solid rgba(255,255,255,0.1)', fontSize:12 }} cursor={{ fill:'rgba(255,255,255,0.05)' }} />
            <Legend wrapperStyle={{ color: '#94A3B8', fontSize:12 }} />
            <Bar dataKey="Sentiment" fill="#3B82F6" stackId={mode==='stacked'? 'a': undefined} />
            <Bar dataKey="Pulse" fill="#818CF8" stackId={mode==='stacked'? 'a': undefined} />
            <Bar dataKey="Momentum" fill="#A78BFA" stackId={mode==='stacked'? 'a': undefined} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
