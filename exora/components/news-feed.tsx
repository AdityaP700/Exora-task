"use client"

import Link from "next/link";
import type { EventLogItem } from "@/lib/types";
import { ExternalLink, Newspaper } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export function NewsFeed({ title, items }: { title: string; items: EventLogItem[] }) {
  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-xl p-7 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400">Recent updates and announcements</p>
      </div>

      {/* News Items */}
      <div className="space-y-1">
        {items.length === 0 ? (
          <div className="text-center text-slate-500 py-16">
            <Newspaper className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-lg font-medium text-slate-400">No Major Signals Found</p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              We didn't detect recent funding, launch, or acquisition events in the last 90 days.
            </p>
          </div>
        ) : (
          <>
            {items.slice(0, 5).map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-lg transition-all duration-150 ease-in-out hover:bg-white/10 group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-medium text-slate-100 leading-snug mb-1.5 group-hover:text-cyan-300 transition-colors">{item.headline}</h3>
                    <p className="text-xs text-slate-400">
                      {item.source || new URL(item.url).hostname} • {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0 ml-4 mt-1 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </a>
            ))}
          </>
        )}
      </div>

      {/* View All Link */}
      {items.length > 5 && (
        <div className="mt-5 text-right">
          <Link href="#" className="text-sm font-medium text-cyan-400 hover:underline">
            View all news →
          </Link>
        </div>
      )}
    </div>
  );
}
