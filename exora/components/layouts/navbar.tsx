// components/layout/navbar.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Home, Search, GitCompareArrows, BookOpen, Github } from "lucide-react"
import { HoverButton } from "@/components/ui/hover-button"

export function Navbar() {
  const navItems = [
    { name: "Search", icon: Search },
    { name: "GitHub", icon: Github },
  ]

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 70, damping: 20 }}
        className="flex items-center justify-between p-2 rounded-full bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 shadow-lg"
      >
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.name}
              href="#"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-full hover:bg-slate-800/50"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
        <HoverButton className="px-4 py-1.5 text-sm">
          Try It Now
        </HoverButton>
      </motion.div>
    </header>
  )
}