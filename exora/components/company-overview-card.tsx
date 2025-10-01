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
    profile.industry ? { icon: Building, value: profile.industry } : null,
    profile.foundedYear ? { icon: Calendar, value: profile.foundedYear } : null,
    profile.headquarters ? { icon: MapPin, value: profile.headquarters } : null,
  profile.headcountRange ? { icon: Users, value: profile.headcountRange } : null,
  !profile.headcountRange && profile.employeeCountApprox ? { icon: Users, value: Intl.NumberFormat('en-US').format(profile.employeeCountApprox) + ' employees' } : null,
  ].filter(Boolean) as { icon: any; value: string }[]

  const brief = profile.brief || (profile.description || '').split(/(?<=[.!?])\s+/).slice(0,2).join(' ').slice(0,180)
  const logo = profile.logoUrl || `https://logo.clearbit.com/${displayDomain}`

  // Prioritize CEO / CTO ordering if roles are present
  const prioritizedFounders = [...founders].sort((a,b)=>{
    const rank = (f: FounderInfo) => /ceo/i.test(f.role||'') ? 0 : (/cto/i.test(f.role||'') ? 1 : 2)
    return rank(a) - rank(b)
  })

  const paragraphs = (profile.description || '').split(/\n\n|(?<=[.!?])\s+(?=[A-Z])/).filter(p=>p.trim()).slice(0,3)

  return (
    <section className="glass rounded-2xl p-6 backdrop-blur-md bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/10 shadow-xl space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={profile.name} className="w-full h-full object-contain p-1" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }} />
            {/* fallback letter overlay if image fails hidden above */}
            <span className="absolute text-slate-300 text-lg font-semibold select-none">
              {profile.name?.[0] || 'C'}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[11px] tracking-wider text-slate-400 mb-1">COMPANY OVERVIEW</h2>
            <h1 className="text-2xl font-semibold text-slate-100 leading-tight truncate" title={profile.name}>{profile.name}</h1>
            <a href={`https://${displayDomain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400/80 hover:text-cyan-300 underline-offset-2">
              {displayDomain}
            </a>
          </div>
        {profile.profileDataQuality && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Data Quality</span>
            <span
              className={
                "px-2 py-0.5 rounded-full text-[11px] font-medium border " +
                (profile.profileDataQuality === 'high'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30'
                  : profile.profileDataQuality === 'medium'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-400/30'
                  : 'bg-slate-600/20 text-slate-300 border-slate-500/30')
              }
              title="Heuristic completeness of core company fields"
            >
              {profile.profileDataQuality}
            </span>
          </div>
        )}
        </div>
        {/* {typeof sentimentScore === 'number' && (
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Sentiment</span>
            <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-medium">
              {Math.round(sentimentScore)}/100
            </div>
          </div>
        )} */}
      </header>

      {/* Brief */}
      {brief && (
        <p className="text-sm text-slate-300 leading-relaxed">{brief}</p>
      )}

      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link, i) => (
              <a key={i} href={link!.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors border border-white/10">
                {link && <link.icon className="w-4 h-4 text-cyan-300" />}
                <span className="truncate max-w-[110px]">{new URL(link!.href).hostname.replace(/^www\./,'')}</span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[11px] tracking-wider text-slate-500 mb-2">ESSENCE</h3>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            {paragraphs.length ? paragraphs.map((p,i)=>(<p key={i}>{p}</p>)) : <p className="italic text-slate-500">No description available.</p>}
          </div>
        </div>

        {details.length > 0 && (
          <div>
            <h3 className="text-[11px] tracking-wider text-slate-500 mb-2">SNAPSHOT</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              {details.map((d,i)=>(
                <li key={i} className="flex items-center gap-2">
                  <d.icon className="w-4 h-4 text-cyan-300" />
                  <span>{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-[11px] tracking-wider text-slate-500 mb-2">HUMANS</h3>
          {prioritizedFounders && prioritizedFounders.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {prioritizedFounders.map((f,i)=>{
                const social = f.linkedin || f.twitter
                const Icon = f.linkedin ? Linkedin : (f.twitter ? Twitter : null)
                return (
                  <div key={i} className="group relative rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] px-4 py-3 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center text-[11px] text-cyan-200 font-medium">
                        {f.name.split(/\s+/).slice(0,2).map(n=>n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 truncate">{f.name}</p>
                        {f.role && <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">{f.role}</p>}
                      </div>
                    </div>
                    {social && Icon && (
                      <a href={social} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-300 transition-colors ml-3 flex-shrink-0">
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
        </div>
      </div>
    </section>
  )
}
