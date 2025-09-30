// components/company-overview-card.tsx
"use client";

import { Linkedin, Twitter, Globe, Building, Calendar, MapPin, Users } from "lucide-react";
import type { CompanyProfile, FounderInfo } from "@/lib/types";

export function CompanyOverviewCard({ profile, founders }: { profile: CompanyProfile | null; founders: FounderInfo[] }) {
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
    { href: profile.socials?.twitter, icon: Twitter },
    { href: profile.socials?.linkedin, icon: Linkedin },
  ].filter(link => link.href && link.href.includes('http')); // Basic validation

  const details = [
    { icon: Building, value: 'Information Technology' },
    { icon: Calendar, value: '2010' },
    { icon: MapPin, value: 'San Francisco, CA' },
    { icon: Users, value: '1,001-5,000' },
  ];

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-xl p-7 backdrop-blur-sm h-full flex flex-col">
      {/* Company Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
        <a href={`https://${displayDomain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">
          {displayDomain}
        </a>
      </div>

      {/* Social Links */}
      <div className="mt-4 flex items-center gap-2">
        {socialLinks.map((link, index) => (
          <a 
            key={index} 
            href={link.href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/70 text-slate-400 hover:text-white transition-colors"
          >
            <link.icon className="w-4 h-4" />
          </a>
        ))}
      </div>

      {/* Description */}
      <p className="mt-5 text-slate-300 text-sm leading-relaxed">
        {profile.description}
      </p>

      {/* Divider */}
      <div className="my-6 border-t border-white/10"></div>

      {/* Metadata */}
      <div className="space-y-3">
        {details.map((detail, index) => (
          <div key={index} className="flex items-center gap-3">
            <detail.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-300">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
