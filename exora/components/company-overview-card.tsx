// components/company-overview-card.tsx
"use client";

import { Linkedin, Twitter, Globe, Building, Calendar, MapPin, Users, Shield } from "lucide-react";
import type { CompanyProfile, FounderInfo } from "@/lib/types";

interface Props { profile: CompanyProfile | null; founders: FounderInfo[]; sentimentScore?: number }

export function CompanyOverviewCard({ profile, founders, sentimentScore }: Props) {
  if (!profile) {
    return (
      <div className="glass sketch-border rounded-xl p-7 animate-pulse space-y-4">
        <div className="h-8 w-3/4 bg-slate-700/60 rounded"></div>
        <div className="h-4 w-1/2 bg-slate-700/50 rounded"></div>
        <div className="h-24 w-full bg-slate-700/40 rounded"></div>
      </div>
    )
  }

  const displayDomain = profile.domain?.replace(/^https?:\/\//, "").replace(/^www\./, "");

  const socialLinks = [
    { href: `https://${displayDomain}`, icon: Globe },
    profile.socials?.linkedin ? { href: profile.socials.linkedin, icon: Linkedin } : null,
    !profile.socials?.linkedin && profile.socials?.twitter ? { href: profile.socials.twitter, icon: Twitter } : null,
  ].filter((link: any) => link && link.href && link.href.includes('http'));

  const details = [
    { icon: Building, value: 'Information Technology' },
    { icon: Calendar, value: '2010' },
    { icon: MapPin, value: 'San Francisco, CA' },
    { icon: Users, value: '1,001-5,000' },
  ];

  const paragraphs = (profile.description || '').split(/\n\n|(?<=[.!?])\s+(?=[A-Z])/).filter(p=>p.trim()).slice(0,3)

  return (
    <div className="flex flex-col gap-5">
      {/* Identity Section */}
      <section aria-labelledby="identity" className="glass sketch-border rounded-xl p-5 hover-glow">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h2 id="identity" className="font-mono text-[11px] tracking-wider text-amber-300/90 mb-1">IDENTITY</h2>
            <h1 className="text-2xl font-bold text-cyan-300 leading-tight">{profile.name}</h1>
            <a href={`https://${displayDomain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400/80 hover:text-cyan-300 underline-offset-2">
              {displayDomain}
            </a>
          </div>
          {typeof sentimentScore === 'number' && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Sentiment</span>
              <div className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-medium">
                {Math.round(sentimentScore)}/100
              </div>
            </div>
          )}
        </header>
      </section>

      {/* Trust Anchors */}
      <section aria-labelledby="trust" className="glass sketch-border rounded-xl p-4 hover-glow">
        <h2 id="trust" className="font-mono text-[11px] tracking-wider text-amber-300/90 mb-3 flex items-center gap-1"><Shield className="w-3 h-3"/>TRUST ANCHORS</h2>
        <div className="flex flex-wrap gap-2">
          {socialLinks.map((link, i) => (
            <a key={i} href={link!.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 text-slate-300 text-xs transition-colors">
              {link && <link.icon className="w-4 h-4 text-amber-300" />}
              <span className="truncate max-w-[110px]">{new URL(link!.href).hostname.replace(/^www\./,'')}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Essence */}
      <section aria-labelledby="essence" className="glass sketch-border rounded-xl p-5 hover-glow">
        <h2 id="essence" className="font-mono text-[11px] tracking-wider text-amber-300/90 mb-3">ESSENCE</h2>
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          {paragraphs.length ? paragraphs.map((p,i)=>(<p key={i}>{p}</p>)) : <p className="italic text-slate-500">No description available.</p>}
        </div>
      </section>

      {/* Snapshot */}
      <section aria-labelledby="snapshot" className="glass sketch-border rounded-xl p-5 hover-glow">
        <h2 id="snapshot" className="font-mono text-[11px] tracking-wider text-amber-300/90 mb-3">SNAPSHOT</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          {details.map((d,i)=>(
            <li key={i} className="flex items-center gap-2">
              <d.icon className="w-4 h-4 text-amber-300" />
              <span>{d.value}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Humans */}
      <section aria-labelledby="humans" className="glass sketch-border rounded-xl p-5 hover-glow">
        <h2 id="humans" className="font-mono text-[11px] tracking-wider text-amber-300/90 mb-4">HUMANS</h2>
        {founders && founders.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {founders.map((f,i)=>{
              const social = f.linkedin || f.twitter
              const Icon = f.linkedin ? Linkedin : (f.twitter ? Twitter : null)
              return (
                <div key={i} className="group relative rounded-lg border border-amber-400/30 bg-slate-800/30 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/40 to-blue-500/30 flex items-center justify-center text-[11px] text-cyan-200 font-medium">
                      {f.name.split(/\s+/).slice(0,2).map(n=>n[0]).join('')}
                    </div>
                    <span className="text-sm text-slate-200 truncate">{f.name}</span>
                  </div>
                  {social && Icon && (
                    <a href={social} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-amber-300 transition-colors ml-3 flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Leadership data not available.</p>
        )}
      </section>
    </div>
  )
}
