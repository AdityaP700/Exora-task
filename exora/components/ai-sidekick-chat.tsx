"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { MessageCircle, Save, Share, TrendingUp, Zap, Send, Sparkles } from "lucide-react"

export function AISidekickChat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content: "Hi! I can help you analyze trends and generate insights. What would you like to explore?",
    },
  ])

  const handleSendMessage = () => {
    if (!message.trim()) return

    setMessages((prev) => [
      ...prev,
      { type: "user", content: message },
      { type: "ai", content: "Analyzing your request... I can see interesting patterns in the current data trends." },
    ])
    setMessage("")
  }

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-primary" />
            <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1" />
          </div>
          <h3 className="font-semibold text-foreground">AI Sidekick Chat</h3>
        </div>

        <div className="relative">
          <Input
            placeholder="Type your prompt..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8"
            onClick={handleSendMessage}
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">+ Summarize these sentiment trends to pitch deck</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                msg.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-2 border-b border-border">
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
          <Save className="w-4 h-4" />
          Save to Workspace
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
          <Share className="w-4 h-4" />
          Export to Slack
        </Button>
      </div>

      {/* Market Signals */}
      <div className="p-4 flex-1">
        <div className="mb-4">
          <h4 className="font-medium text-foreground mb-2">Market Traction Signal</h4>
          <Card className="p-3 bg-muted/50">
            <div className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-foreground">Neuralink - Mentions</span>
                <Badge variant="secondary" className="bg-chart-2 text-white text-xs">
                  +18%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">BRK-14</div>
              <div className="mt-2 h-8 bg-gradient-to-r from-chart-2/20 to-chart-2/5 rounded flex items-end justify-end pr-2">
                <TrendingUp className="w-3 h-3 text-chart-2" />
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h4 className="font-medium text-foreground mb-3">Emerging & Declining Topics</h4>
          <div className="text-sm text-muted-foreground mb-3">Trends of TC trends of topics</div>

          <div className="space-y-4">
            {/* Emerging Section */}
            <Card className="p-3 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-chart-2"></div>
                <span className="text-sm font-medium text-foreground">Emerging:</span>
                <TrendingUp className="w-3 h-3 text-chart-2" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">NFT le FDA (Positive)</span>
                  <Badge variant="outline" className="text-xs border-chart-2 text-chart-2">
                    <TrendingUp className="w-2 h-2 mr-1" />
                    Hot
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">(+1500)</div>
              </div>
            </Card>

            {/* Declining Section */}
            <Card className="p-3 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                <span className="text-sm font-medium text-foreground">Spiking:</span>
                <Zap className="w-3 h-3 text-accent" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Neuralink FDA Approval</span>
                  <Badge variant="outline" className="text-xs border-accent text-accent">
                    <Zap className="w-2 h-2 mr-1" />
                    Spike
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">(positive)</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-4 border-t border-border">
        <div className="text-center">
          <div className="text-sm font-medium text-foreground mb-1">Actionable insights in seconds</div>
          <div className="flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" />
            <span className="text-xs text-muted-foreground">Powered by Exora AI</span>
          </div>
        </div>
      </div>
    </div>
  )
}
