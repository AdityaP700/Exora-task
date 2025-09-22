"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import type { BenchmarkMatrixRow } from "@/lib/types"

export function CompetitorNews({ competitors }: { competitors: BenchmarkMatrixRow[] }) {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="text-sm font-semibold text-foreground mb-3">Competitor News</div>
      <div className="space-y-4">
        {competitors.slice(1).map((c) => (
          <div key={c.domain}>
            <div className="text-xs font-medium text-muted-foreground mb-1">{c.domain}</div>
            <div className="space-y-2">
              {c.news.length === 0 && (
                <div className="text-xs text-muted-foreground">No recent items</div>
              )}
              {c.news.map((n, i) => (
                <div key={i} className="text-sm">
                  <Link href={n.url} target="_blank" className="text-blue-400 hover:underline">
                    {n.headline}
                  </Link>
                  <div className="text-xs text-muted-foreground">{n.source}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
