"use client"

import { Card } from "@/components/ui/card"
import { Github, Linkedin, Twitter, Globe, Building2, BadgeDollarSign } from "lucide-react"
import type { CompanyProfile, FounderInfo } from "@/lib/types"
import Link from "next/link"

export function CompanyOverviewCard({ profile, founders }: { profile: CompanyProfile; founders: FounderInfo[] }) {
  const displayDomain = profile.domain?.replace(/^https?:\/\//, "").replace(/^www\./, "")
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-xl font-semibold">
          {profile.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">{profile.name || displayDomain}</h2>
            <span className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground">
              {profile.ipoStatus === 'Public' ? 'Public' : profile.ipoStatus === 'Private' ? 'Private' : 'Unknown'}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{profile.description}</p>
        </div>
      </div>

      {/* Socials */}
      <div className="mt-4 flex items-center gap-3">
        {profile.socials?.linkedin && (
          <Link href={profile.socials.linkedin} target="_blank" className="text-slate-300 hover:text-white">
            <Linkedin className="w-4 h-4" />
          </Link>
        )}
        {profile.socials?.twitter && (
          <Link href={profile.socials.twitter} target="_blank" className="text-slate-300 hover:text-white">
            <Twitter className="w-4 h-4" />
          </Link>
        )}
        {profile.socials?.facebook && (
          <Link href={profile.socials.facebook} target="_blank" className="text-slate-300 hover:text-white">
            <Github className="w-4 h-4" />
          </Link>
        )}
        <Link href={`https://${displayDomain}`} target="_blank" className="text-slate-300 hover:text-white ml-auto flex items-center gap-1 text-xs">
          <Globe className="w-3 h-3" />
          {displayDomain}
        </Link>
      </div>

      {/* Founders */}
      {founders?.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-medium text-foreground mb-2">Founders</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {founders.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border p-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs">
                    {f.name?.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm text-foreground">{f.name}</div>
                    <div className="text-xs text-muted-foreground">Founder</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {f.linkedin && (
                    <Link href={f.linkedin} target="_blank" className="text-slate-300 hover:text-white">
                      <Linkedin className="w-3 h-3" />
                    </Link>
                  )}
                  {f.twitter && (
                    <Link href={f.twitter} target="_blank" className="text-slate-300 hover:text-white">
                      <Twitter className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
