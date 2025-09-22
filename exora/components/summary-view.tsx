"use client"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AiSummaryData } from "@/lib/types"
import { Loader2, FileDown, Share2 } from "lucide-react"

type Props = { data: AiSummaryData }

export function SummaryView({ data }: Props) {
  // Simulate staged loading: TL;DR appears immediately; exec summary appears after a short delay
  const [showExecSummary, setShowExecSummary] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowExecSummary(true), 1200)
    return () => clearTimeout(t)
  }, [data])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main summary */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-2">Groq TL;DR</div>
          <div className="text-sm text-foreground">{data.groqTlDr}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-3">Executive Summary</div>
          {showExecSummary ? (
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {data.summary.map((s, i) => (
                <li key={i} className="text-foreground">{s.replace(/^•\s*/, '')}</li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Generating refined summary…
            </div>
          )}
        </Card>
      </div>

      {/* Actions */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-4 space-y-3">
          <div className="text-sm font-medium text-foreground">Export</div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => {
                // Simple, reliable print-to-PDF
                if (typeof window !== 'undefined') window.print()
              }}
            >
              <FileDown className="w-4 h-4" /> PDF
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={async () => {
                try {
                  const shareData = {
                    title: 'Exora Briefing',
                    text: 'Quick briefing summary',
                    url: typeof window !== 'undefined' ? window.location.href : ''
                  }
                  if (navigator.share) {
                    await navigator.share(shareData as any)
                  } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareData.url)
                    alert('Link copied to clipboard')
                  }
                } catch (e) {
                  console.warn('Share failed:', e)
                }
              }}
            >
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">Use your browser’s “Save as PDF” in the print dialog.</div>
        </Card>
      </div>
    </div>
  )
}
