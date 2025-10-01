"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import type { AiSummaryData, BriefingResponse } from "@/lib/types"
import { Loader2, FileDown, Share2, Sparkles } from "lucide-react"

type Props = { data: AiSummaryData; context?: { domain: string; sentiment?: number; competitors?: { domain: string; sentiment: number }[]; description?: string } }

export function SummaryView({ data, context }: Props) {
  const [showExecSummary, setShowExecSummary] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowExecSummary(true), 1200)
    return () => clearTimeout(t)
  }, [data])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: 'Exora Briefing',
        text: 'Quick briefing summary',
        url: typeof window !== 'undefined' ? window.location.href : ''
      };
      if (navigator.share) {
        await navigator.share(shareData as any);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard');
      }
    } catch (e) {
      console.warn('Share failed:', e);
    }
  };

  // Flexible bullet/numbered list parsing for streamed summary text if needed later
  const normalizeBullet = (line: string) => line.replace(/^([•\-*]|\d+\.)\s*/, '').trim()
  const points = data.summary.map(s => normalizeBullet(s)).filter(s => s.length > 2)

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-xl p-7 backdrop-blur-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <div className="w-5 h-5 text-cyan-400" />
            Executive Summary
          </h2>
          <p className="text-sm text-slate-400">AI-generated insights and key takeaways</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant="ghost" size="icon" onClick={handleShare} className="text-slate-400 hover:text-white hover:bg-white/10">
            <Share2 className="w-4 h-4" />
          </Button> */}
          {/* <Button variant="ghost" size="icon" onClick={handlePrint} className="text-slate-400 hover:text-white hover:bg-white/10">
            <FileDown className="w-4 h-4" />
          </Button> */}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* TL;DR Section (restored & enriched) */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-cyan-400">TL;DR</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            {context?.description || data.groqTlDr || 'Overview not available.'}
          </p>
          {context && (
            <div className="flex flex-wrap gap-2 text-[11px]">
              {typeof context.sentiment === 'number' && (
                <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-400/20 text-blue-300">Sentiment {Math.round(context.sentiment)}/100</span>
              )}
              {context.competitors && context.competitors.length > 0 && (
                <span className="px-2 py-1 rounded bg-slate-700/40 text-slate-300 border border-white/5">
                  Avg Competitors {Math.round(context.competitors.reduce((a,c)=>a+c.sentiment,0)/context.competitors.length)}/100
                </span>
              )}
              {context.competitors && context.competitors.length > 0 && typeof context.sentiment === 'number' && (
                (() => {
                  const avg = context.competitors.reduce((a,c)=>a+c.sentiment,0)/context.competitors.length
                  const diff = context.sentiment - avg
                  return <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-400/20 text-indigo-300">Δ vs peers {diff>0?'+':''}{Math.round(diff)}</span>
                })()
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10"></div>

        {/* Key Points Section */}
        <div>
          <h3 className="text-sm font-semibold text-cyan-400 mb-3">Strategic Points</h3>
          {showExecSummary ? (
            <ul className="space-y-2">
              {points.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-1.5 flex-shrink-0">▪</span>
                  <span className="text-slate-300 text-sm">{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing for key insights...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
