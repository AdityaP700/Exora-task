"use client"
import { ExternalLink } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import type { EventLogItem } from "@/lib/types"
import { NewsThumbnail } from "@/components/news-thumbnail"

interface Props { items: EventLogItem[] }

export function CompanyNewsGrid({ items }: Props) {
  const grid = items.slice(0, 3)
  return (
    <section aria-labelledby="company-news" className="glass rounded-2xl p-5 backdrop-blur-md bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/10 shadow-lg">
      <header className="mb-4">
        <h2 id="company-news" className="text-[11px] font-medium tracking-wider text-slate-400 mb-1">LATEST COMPANY NEWS</h2>
        <p className="text-xs text-slate-500">Recent updates & announcements</p>
      </header>
      {grid.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">No recent company news detected.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {grid.map((n, i) => {
          return (
            <a
              key={i}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex flex-col shadow-sm"
            >
              <div className="h-32 w-full relative overflow-hidden">
                <NewsThumbnail url={n.url} headline={n.headline} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-70 group-hover:opacity-60 transition" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-medium text-slate-100 line-clamp-2 group-hover:text-cyan-300 transition-colors mb-3">
                  {n.headline}
                </h3>
                <div className="mt-auto flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[120px]">
                    {(() => { try { return new URL(n.url).hostname.replace(/^www\./,'') } catch { return '' } })()}
                  </span>
                  <span>{formatDistanceToNow(new Date(n.date), { addSuffix: true })}</span>
                </div>
                <ExternalLink className="w-4 h-4 absolute top-2 right-2 text-slate-500 group-hover:text-cyan-300 transition" />
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
