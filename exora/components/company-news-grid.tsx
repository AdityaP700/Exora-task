"use client";

import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import type { EventLogItem } from "@/lib/types";
import { NewsThumbnail } from "@/components/news-thumbnail";

interface Props { items: EventLogItem[] }

export function CompanyNewsGrid({ items }: Props) {
  const grid = items.slice(0, 3); // keep top 3 news
  return (
    <section className="glass rounded-2xl p-4 backdrop-blur-md bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/10 shadow-lg">
      <header className="mb-3">
        <h2 className="text-[10px] font-medium tracking-wider text-slate-400 mb-1">LATEST COMPANY NEWS</h2>
        <p className="text-[10px] text-slate-500">Recent updates & announcements</p>
      </header>

      {grid.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-xs">No recent company news detected.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {grid.map((n, i) => {
          const hostname = (() => { try { return new URL(n.url).hostname.replace(/^www\./,'') } catch { return '' } })();
          return (
            <a
              key={i}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-lg overflow-hidden border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors flex flex-col shadow-sm h-full"
            >
              <div className="h-24 w-full relative overflow-hidden">
                <NewsThumbnail url={n.url} headline={n.headline} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-70 group-hover:opacity-60 transition" />
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-xs font-medium text-slate-100 line-clamp-2 group-hover:text-cyan-300 transition-colors mb-2">
                  {n.headline}
                </h3>
                <div className="mt-auto flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[100px]">{hostname}</span>
                  <span>{formatDistanceToNow(new Date(n.date), { addSuffix: true })}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 absolute top-1.5 right-1.5 text-slate-500 group-hover:text-cyan-300 transition" />
              </div>
            </a>
          )
        })}
      </div>
    </section>
  );
}
