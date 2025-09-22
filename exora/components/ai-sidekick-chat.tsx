"use client"

import { Card } from "@/components/ui/card"
import { MessageCircle, Sparkles } from "lucide-react"
import type { AiSummaryData } from "@/lib/types"

type Props = { data?: AiSummaryData }

export function AISidekickChat({ data }: Props) {
  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-primary" />
            <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1" />
          </div>
          <h3 className="font-semibold text-foreground">AI Sidekick</h3>
        </div>
        <p className="text-xs text-muted-foreground">Strategic TL;DR and synthesis</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {data ? (
          <>
            <Card className="p-3 bg-muted/50">
              <div className="text-sm text-foreground">{data.groqTlDr}</div>
            </Card>
            {data.summary && data.summary.length > 0 ? (
              <div className="space-y-2">
                {data.summary.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-accent">•</span>
                    <span className="text-foreground">{point.replace(/^\u2022\s*/, '')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Generating executive summary…</div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Provide a company domain to see the TL;DR and summary here.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-center">
          <div className="text-sm font-medium text-foreground mb-1">Actionable insights in seconds</div>
          <div className="flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" />
            <span className="text-xs text-muted-foreground">Powered by Exora AI</span>
          </div>
        </div>
      </div>
    </div>
  )
}
