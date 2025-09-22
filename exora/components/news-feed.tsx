"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import type { EventLogItem } from "@/lib/types"

export function NewsFeed({ title, items }: { title: string; items: EventLogItem[] }) {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="text-sm font-semibold text-foreground mb-3">{title}</div>
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center text-slate-400 py-6">
            <p className="text-sm font-semibold">No Major Signals Found</p>
            <p className="text-xs">We didn't detect recent funding, launch, or acquisition events in the last 90 days.</p>
          </div>
        )}
        {items.map((n, i) => (
          <div key={i} className="text-sm">
            <Link href={n.url} target="_blank" className="text-blue-400 hover:underline">
              {n.headline}
            </Link>
            <div className="text-xs text-muted-foreground">{new Date(n.date).toLocaleDateString()} • {n.type}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
