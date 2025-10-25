"use client"

import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { AISidekickChat } from './ai-sidekick-chat'
import type { BriefingResponse } from '@/lib/types'

export default function BriefingChatWidget({ data }: { data?: BriefingResponse }) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  // Show the FAB when briefing data is present
  useEffect(() => {
    if (data) {
      setVisible(true)
    } else {
      setVisible(false)
      setOpen(false)
    }
  }, [data])

  if (!visible) return null

  return (
    <div>
      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 h-96 shadow-2xl rounded-lg overflow-hidden">
          <div className="h-full bg-card border border-border flex flex-col">
            <div className="flex items-center justify-between p-2 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <div className="text-sm font-semibold">Briefing Chat</div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted/30">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <AISidekickChat data={data} />
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        aria-label="Open briefing chat"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-white p-3 rounded-full shadow-lg hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    </div>
  )
}
