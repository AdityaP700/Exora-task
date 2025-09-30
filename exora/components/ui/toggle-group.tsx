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
    <div className={cn("inline-flex items-center gap-1 rounded-lg bg-card-primary border border-white/10 p-1", className)}>
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
        "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out",
        selected
          ? "bg-accent-blue text-white shadow-sm"
          : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
    >
      {children}
    </button>
  )}
