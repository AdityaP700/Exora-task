"use client"
import type { BenchmarkMatrixItem } from "@/lib/types"
import { ExternalLink, Newspaper } from "lucide-react"
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
    <section aria-labelledby="competitor-news" className="glass sketch-border rounded-xl p-5 flex flex-col h-full">
      <header className="mb-4">
        <h2 id="competitor-news" className="font-mono text-[11px] tracking-wider text-amber-300/90 mb-1">COMPETITOR NEWS</h2>
        <p className="text-xs text-slate-400">Updates from industry peers</p>
      </header>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={()=>setActive('All')} className={`px-3 py-1.5 rounded-full text-xs border transition ${active==='All'? 'bg-amber-500/20 border-amber-400/50 text-amber-300':'border-amber-400/30 text-slate-400 hover:text-amber-300'}`}>All</button>
        {domains.map(d=>(
          <button key={d} onClick={()=>setActive(d)} className={`px-3 py-1.5 rounded-full text-xs border truncate max-w-[120px] transition ${active===d? 'bg-amber-500/20 border-amber-400/50 text-amber-300':'border-amber-400/30 text-slate-400 hover:text-amber-300'}`}>{d}</button>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto pr-1 scrollbar-amber space-y-3">
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
            const favicon = host ? `https://www.google.com/s2/favicons?sz=64&domain=${host}`: null
            return (
              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="group block rounded-lg border border-amber-400/20 bg-slate-800/40 hover:bg-slate-700/40 transition-colors p-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-slate-700/40 flex items-center justify-center overflow-hidden ring-1 ring-white/5">
                    {favicon ? <img src={favicon} alt={host} className="w-5 h-5 opacity-80" /> : <span className="text-[11px] text-amber-300">{host[0]||'?'}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">{n.headline}</p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                      <span className="truncate">{host}</span>
                      <span className="text-slate-600">•</span>
                      <span>{time}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-300/70">{n._d}</span>
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 transition" />
                </div>
              </a>
            )})}
        </div>
      </div>
    </section>
  )
}