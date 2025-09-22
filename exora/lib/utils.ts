import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize incoming date-like values to a safe ISO string without future drift
export function normalizePublishedDate(input: any): string {
  let d: Date
  try {
    d = input instanceof Date ? input : new Date(input)
  } catch {
    d = new Date()
  }
  if (isNaN(d.getTime())) {
    d = new Date()
  }
  const now = new Date()
  // Clamp to now if in the future (allow slight clock skew of +1 day)
  if (d.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
    d = now
  }
  // Optionally guard against ancient dates; keep as-is unless totally invalid
  return d.toISOString()
}
