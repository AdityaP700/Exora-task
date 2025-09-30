"use client"

import { Bot, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AiAssistant() {
  return (
    <div className="bg-card-primary rounded-xl p-6 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20">
      <div className="flex items-center gap-4 mb-4">
        <Bot className="w-8 h-8 text-white" />
        <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Hi, can you analyze my recent spending and tell me where I can cut costs without affecting core operations?
      </p>
      <div className="relative">
        <Input
          placeholder="How can I help you?"
          className="bg-input border-white/20 text-white placeholder:text-muted-foreground pr-12"
        />
        <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
