"use client"

import { MessageCircle, Sparkles } from "lucide-react"
import type { AiSummaryData, BriefingResponse } from "@/lib/types"
import { useState, useRef, useEffect } from 'react'
import { useApiKeyStore } from '@/lib/store'

type Msg = { role: 'user' | 'assistant' | 'system'; text: string }
type Props = { data?: AiSummaryData | BriefingResponse; fullWidth?: boolean }

export function AISidekickChat({ data, fullWidth }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  // BYOK keys from store
  const { groqApiKey, geminiApiKey, openAiApiKey } = useApiKeyStore()

  useEffect(() => {
    // reset conversation when data changes
    setMessages(prev => {
      // preserve system note if present
      return prev.filter(m => m.role === 'system')
    })
  }, [data])

  useEffect(() => {
    // auto-scroll
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, isLoading])

  const append = (m: Msg) => setMessages(prev => [...prev, m])

  function buildContextPayload() {
    // If we have a full BriefingResponse, send trimmed useful parts; otherwise include aiSummary only.
    if (!data) return { aiSummary: null }
    const isFull = (data as BriefingResponse).requestDomain !== undefined
    if (!isFull) return { aiSummary: data as AiSummaryData }

    const full = data as BriefingResponse
    const benchmark = (full.benchmarkMatrix || []).map((b) => ({
      domain: b.domain,
      sentimentScore: b.sentimentScore,
      narrativeMomentum: b.narrativeMomentum,
      topNews: (b.news || []).slice(0, 3).map(n => ({ headline: n.headline, url: n.url, publishedDate: n.publishedDate }))
    }))

    return {
      requestDomain: full.requestDomain,
      companyProfile: full.companyProfile,
      founderInfo: full.founderInfo || [],
      benchmark,
      newsFeed: (full.newsFeed || []).slice(0, 8),
      aiSummary: full.aiSummary || null
    }
  }

  async function handleSend() {
    const q = input.trim()
    if (!q || !data) return
    append({ role: 'user', text: q })
    setInput('')
    setIsLoading(true)

    const payload = {
      question: q,
      context: buildContextPayload()
    }

    try {
      const res = await fetch('/api/briefing/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-groq-api-key': groqApiKey || '',
          'x-gemini-api-key': geminiApiKey || '',
          'x-openai-api-key': openAiApiKey || ''
        },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (!res.ok) {
        const errMsg = json?.error || json?.details || 'Failed to get answer'
        append({ role: 'assistant', text: `Error: ${errMsg}` })
      } else {
        append({ role: 'assistant', text: json.answer || 'No answer returned' })
      }
    } catch (err: any) {
      append({ role: 'assistant', text: `Request failed: ${err?.message || String(err)}` })
    } finally {
      setIsLoading(false)
    }
  }

  const containerClass = fullWidth
    ? 'w-full bg-slate-900/60 border border-white/5 rounded-lg p-0 flex flex-col h-full min-h-0'
    : 'w-80 bg-card border-l border-border flex flex-col h-full'

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex-none bg-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">AI Sidekick</h4>
            <div className="text-xs text-slate-300">Ask follow-ups about this briefing</div>
          </div>
        </div>
      </div>

  {/* Messages */}
  <div ref={listRef} className="p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-slate-300">Ask a question about the briefing to get an answer based only on the fetched data.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-md max-w-full ${m.role === 'user' ? 'bg-blue-600/10 text-blue-300 self-end' : 'bg-slate-800/60 text-slate-100 self-start'}`}>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
        {isLoading && (
          <div className="p-2 rounded-md bg-slate-800/50 text-sm text-slate-200">Thinking…</div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/5 flex-none bg-transparent">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Press Enter to send, Shift+Enter to insert newline
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!isLoading && input.trim()) {
                  handleSend()
                }
              }
            }}
            rows={2}
            placeholder="Ask a follow-up question..."
            className="flex-1 resize-none p-2 bg-slate-800/30 border border-white/5 rounded-md text-sm text-slate-100 placeholder:text-slate-400 h-12"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-cyan-500 text-white rounded-md disabled:opacity-50"
          >
            Ask
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-center text-xs text-slate-400 flex-none">
        Powered by Exora — answers restricted to briefing data only
      </div>
    </div>
  )
}
