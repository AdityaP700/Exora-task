"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import type { NewsItem } from "@/lib/types"

export function NewsFeed({ title, items }: { title: string; items: NewsItem[] }) {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="text-sm font-semibold text-foreground mb-3">{title}</div>
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-xs text-muted-foreground">No items found.</div>
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
