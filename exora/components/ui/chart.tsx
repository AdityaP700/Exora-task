"use client"
import * as React from "react"
import { Tooltip as RechartsTooltip, TooltipProps } from "recharts"

export type ChartConfig = Record<string, { label: string; color: string }>

type ChartContainerProps = {
  config: ChartConfig
  className?: string
  children: React.ReactNode
}

// Provides CSS variables for each dataKey color, e.g. --color-sentiment
export function ChartContainer({ config, className = "", children }: ChartContainerProps) {
  const style: React.CSSProperties = {}
  for (const key of Object.keys(config)) {
    ;(style as any)[`--color-${key}`] = config[key].color
  }
  return (
    <div className={className} style={style as React.CSSProperties}>
      {children}
    </div>
  )
}

type ChartTooltipProps = {
  content: React.ReactNode
  cursor?: boolean | object
}

// Thin wrapper around Recharts Tooltip to keep API parity with examples
export function ChartTooltip({ content, cursor = true }: ChartTooltipProps) {
  return <RechartsTooltip cursor={cursor} content={content as any} />
}

type Indicator = "line" | "dashed" | "dot"

type ChartTooltipContentProps = {
  indicator?: Indicator
}

// Basic tooltip content that lists series with their colors
export function ChartTooltipContent(
  props: TooltipProps<number, string> & ChartTooltipContentProps
) {
  const { active, payload, label } = props
  const indicator = props.indicator ?? "line"
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-md border bg-popover text-popover-foreground shadow-sm">
      {label ? (
        <div className="px-3 py-2 border-b text-xs text-muted-foreground">{label}</div>
      ) : null}
      <div className="px-3 py-2 space-y-1">
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={
                  indicator === "dot"
                    ? "inline-block w-2 h-2 rounded-full"
                    : indicator === "dashed"
                    ? "inline-block w-3 h-[2px] border-t-2"
                    : "inline-block w-3 h-[2px]"
                }
                style={{ backgroundColor: entry.color, borderColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatNumber(n: any) {
  if (typeof n !== "number") return String(n)
  if (Math.abs(n) >= 1000) return Intl.NumberFormat(undefined, { notation: "compact" }).format(n)
  if (Number.isInteger(n)) return n.toString()
  return n.toFixed(2)
}
