"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type ToggleGroupProps = {
  type?: "single"
  value?: string
  onValueChange?: (value: string | undefined) => void
  className?: string
  children: React.ReactNode
}

export function ToggleGroup({ value, onValueChange, className, children }: ToggleGroupProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-md bg-muted p-1", className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        const childValue = (child.props as any).value as string
        const selected = childValue === value
        return React.cloneElement(child as any, {
          selected,
          onSelect: () => onValueChange?.(childValue),
        })
      })}
    </div>
  )
}

type ToggleGroupItemProps = {
  value: string
  "aria-label"?: string
  selected?: boolean
  onSelect?: () => void
  children: React.ReactNode
}

export function ToggleGroupItem({ selected, onSelect, children }: ToggleGroupItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md transition-colors",
        selected ? "bg-background border border-border" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )}
