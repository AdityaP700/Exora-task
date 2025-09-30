"use client"
import type { BenchmarkMatrixItem } from "@/lib/types"
import { ExternalLink, Newspaper } from "lucide-react"
import { NewsThumbnail } from "@/components/news-thumbnail"
import { formatDistanceToNow } from 'date-fns'
import { useState, useMemo } from 'react'

interface Props { competitors: BenchmarkMatrixItem[] }

export function CompetitorNews({ competitors }: Props) {
  const domains = competitors.map(c=>c.domain)
  const [active, setActive] = useState<string>('All')
  const filtered = useMemo(()=>{
    if(active==='All') return competitors
    return competitors.filter(c=>c.domain===active)
  },[active, competitors])
  const flatNews = filtered.flatMap(c=> (c.news||[]).map(n=>({...n, _d:c.domain})))
  const hasNews = flatNews.length>0

  return (
    <section aria-labelledby="competitor-news" className="glass rounded-2xl p-5 flex flex-col h-full backdrop-blur-md bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/10 shadow-lg">
      <header className="mb-4">
        <h2 id="competitor-news" className="text-[11px] font-medium tracking-wider text-slate-400 mb-1">COMPETITOR NEWS</h2>
        <p className="text-xs text-slate-500">Updates from industry peers</p>
      </header>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={()=>setActive('All')} className={`px-3 py-1.5 rounded-full text-xs border transition backdrop-blur-sm ${active==='All'? 'bg-white/10 border-white/30 text-slate-200':'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}>All</button>
        {domains.map(d=>(
          <button key={d} onClick={()=>setActive(d)} className={`px-3 py-1.5 rounded-full text-xs border truncate max-w-[120px] transition backdrop-blur-sm ${active===d? 'bg-white/10 border-white/30 text-slate-200':'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}>{d}</button>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto pr-1 space-y-3">
          {!hasNews && (
            <div className="text-center py-10 text-slate-500 text-sm flex flex-col items-center gap-2">
              <Newspaper className="w-8 h-8 text-slate-600" />
              No competitor news yet.
            </div>
          )}
          {flatNews.slice(0,40).map((n,i)=> {
            let host=''
            try { host = new URL(n.url).hostname.replace(/^www\./,'') } catch {}
            const time = formatDistanceToNow(new Date(n.publishedDate || new Date().toISOString()), { addSuffix: true })
            return (
              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="group block rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md overflow-hidden ring-1 ring-white/10 bg-slate-800/60 flex items-center justify-center">
                    <NewsThumbnail url={n.url} headline={n.headline} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">{n.headline}</p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                      <span className="truncate">{host}</span>
                      <span className="text-slate-600">•</span>
                      <span>{time}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-cyan-300/70">{n._d}</span>
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition" />
                </div>
              </a>
            )})}
        </div>
      </div>
    </section>
  )
}