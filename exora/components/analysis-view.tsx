"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AllInvestorView } from "@/components/all-investor-view"
import { TrendAnalysisView } from "@/components/trend-analysis-view"
import type { BriefingResponse } from "@/lib/types"

type Props = { data: BriefingResponse }

export function AnalysisView({ data }: Props) {
  const [tab, setTab] = useState<"comparison" | "charts">("comparison")

  return (
    <div className="space-y-6">
      {/* Top KPI / IPO card */}
      <Card className="p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">IPO / Listing Status</div>
          <div className="text-lg font-semibold text-foreground">
            {data.companyProfile.ipoStatus}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Domain: <span className="text-foreground">{data.companyProfile.domain}</span>
        </div>
      </Card>

      {/* Sub-toggle between comparison and charts */}
      <div className="flex items-center justify-center">
        <ToggleGroup value={tab} onValueChange={(v) => v && setTab(v as any)}>
          <ToggleGroupItem value="comparison" aria-label="Comparison">Comparison</ToggleGroupItem>
          <ToggleGroupItem value="charts" aria-label="Charts">Charts</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Content area */}
      <div className="space-y-6">
        {tab === "comparison" && <AllInvestorView data={data} />}
        {tab === "charts" && <TrendAnalysisView data={data} />}
      </div>
    </div>
  )
}
