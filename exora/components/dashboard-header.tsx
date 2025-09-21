"use client"
import { ExoraLogo } from "./exora-logo"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Settings, Download, RefreshCw, Search, Filter, X } from "lucide-react"

interface DashboardHeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  showSearch?: boolean
  onSearchToggle?: () => void
}

export function DashboardHeader({ activeTab, onTabChange, showSearch, onSearchToggle }: DashboardHeaderProps) {
  const tabs = [
    { id: "trend-analysis", label: "Trend Analysis" },
    { id: "all-investor", label: "All Investor View" },
  ]

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <ExoraLogo />
          <h1 className="text-xl font-semibold text-foreground">Exora</h1>
        </div>

        {/* User Controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-muted text-muted-foreground text-sm">U</AvatarFallback>
            </Avatar>
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`pb-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {onSearchToggle && (
          <Button
            variant={showSearch ? "default" : "ghost"}
            size="icon"
            onClick={onSearchToggle}
            className={showSearch ? "bg-primary text-primary-foreground" : ""}
          >
            <Search className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for companies, trends, or insights..."
              className="pl-10 pr-20 bg-input border-border"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-6 h-6">
                <Filter className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onSearchToggle}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
