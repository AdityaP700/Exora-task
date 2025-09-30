import Link from "next/link";
import type { BenchmarkMatrixItem, NewsItem } from "@/lib/types";
import { ExternalLink, Search } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export function CompetitorNews({ competitors }: { competitors: BenchmarkMatrixItem[] }) {
  const hasNews = competitors.some(c => c.news && c.news.length > 0);

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-7">
      {/* Header */}
      <div className="mb-5 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Competitor News</h2>
          <p className="text-sm text-slate-400">Updates from industry peers</p>
        </div>
        {/* Optional: Dropdown can be added here */}
      </div>

      {/* Competitor News Feed */}
      <div className="space-y-6">
        {!hasNews ? (
          <div className="text-center text-slate-500 py-16">
            <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-lg font-medium text-slate-400">No Recent Competitor Activity</p>
            <p className="text-sm text-slate-500">No news detected from tracked competitors.</p>
          </div>
        ) : (
          <>
            {competitors.slice(0, 3).map((competitor) => (
              competitor.news && competitor.news.length > 0 && (
                <div key={competitor.domain}>
                  <div className="inline-block mb-3">
                    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs font-semibold text-cyan-300">{competitor.domain}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {competitor.news.slice(0, 2).map((item, i) => (
                      <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3.5 rounded-lg transition-colors duration-150 ease-in-out hover:bg-white/5 border-b border-white/5 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-slate-200 leading-snug mb-1">{item.headline}</h3>
                            <p className="text-xs text-slate-400">
                              {item.source || new URL(item.url).hostname} • {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0 ml-4 mt-1" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )
            ))}
          </>
        )}
      </div>

      {/* View All Link */}
      {hasNews && (
        <div className="mt-6 text-right">
          <Link href="#" className="text-sm font-medium text-cyan-400 hover:underline transition-transform hover:translate-x-1 inline-block">
            View all competitor news →
          </Link>
        </div>
      )}
    </div>
  );
}