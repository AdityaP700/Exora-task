// components/company-overview-card.tsx
"use client";

import { Linkedin, Twitter, Globe, Building, Calendar, MapPin, Users } from "lucide-react";
import type { CompanyProfile, FounderInfo } from "@/lib/types";

interface Props { profile: CompanyProfile | null; founders: FounderInfo[]; sentimentScore?: number }

export function CompanyOverviewCard({ profile, founders, sentimentScore }: Props) {
  if (!profile) {
    return (
      <div className="bg-[#1E293B] border border-white/5 rounded-xl p-7 animate-pulse">
        <div className="h-8 w-3/4 bg-slate-700 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-slate-700 rounded mb-6"></div>
        <div className="h-20 w-full bg-slate-700 rounded mb-8"></div>
        <div className="space-y-4 mt-8">
          <div className="h-6 w-full bg-slate-700 rounded"></div>
          <div className="h-6 w-full bg-slate-700 rounded"></div>
        </div>
      </div>
    );
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

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-xl p-7 backdrop-blur-sm h-full flex flex-col">
      {/* Company Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
          <a href={`https://${displayDomain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">
            {displayDomain}
          </a>
        </div>
        {typeof sentimentScore === 'number' && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Sentiment</span>
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium">
              {Math.round(sentimentScore)}/100
            </div>
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="mt-4 flex items-center gap-2">
        {socialLinks.map((link, index) => (
          <a 
            key={index} 
            href={link!.href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/70 text-slate-400 hover:text-white transition-colors"
          >
            {link && <link.icon className="w-4 h-4" />}
          </a>
        ))}
      </div>

      {/* Description */}
      <p className="mt-5 text-slate-300 text-sm leading-relaxed">
        {profile.description}
      </p>

      {/* Divider */}
      <div className="my-6 border-t border-white/10"></div>

      {/* Key Executives (filtered) */}
      {founders && founders.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500">KEY EXECUTIVES</h3>
          {founders.map((f, i) => {
            const social = f.linkedin || f.twitter
            const Icon = f.linkedin ? Linkedin : (f.twitter ? Twitter : null)
            return (
              <div key={i} className="flex items-center justify-between gap-3 text-sm py-1.5">
                <span className="text-slate-300 truncate">{f.name}</span>
                {social && Icon && (
                  <a href={social} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Metadata (kept minimal or omitted) */}
      <div className="space-y-3">
        {details.slice(0,2).map((detail, index) => (
          <div key={index} className="flex items-center gap-3">
            <detail.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-300">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
