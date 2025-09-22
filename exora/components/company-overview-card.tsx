// components/company-overview-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Twitter, Globe } from "lucide-react";
import type { CompanyProfile, FounderInfo } from "@/lib/types";
import Link from "next/link";

export function CompanyOverviewCard({ profile, founders }: { profile: CompanyProfile; founders: FounderInfo[] }) {
  const displayDomain = profile.domain?.replace(/^https?:\/\//, "").replace(/^www\./, "");
  
  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-50">{profile.name}</CardTitle>
            <CardDescription className="text-cyan-400">{displayDomain}</CardDescription>
          </div>
          {profile.ipoStatus === 'Public' && <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Public</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400 mb-6">{profile.description}</p>
        
        <div className="flex items-center gap-2 mb-6">
          {profile.socials?.linkedin && <SocialButton href={profile.socials.linkedin} icon={Linkedin} />}
          {profile.socials?.twitter && <SocialButton href={profile.socials.twitter} icon={Twitter} />}
          <div className="flex-grow" />
          <Button variant="ghost" asChild>
            <Link href={`https://${displayDomain}`} target="_blank" className="text-slate-400 hover:text-cyan-400 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </Button>
        </div>

        {founders?.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-200 mb-3">Key People</h4>
            <div className="space-y-3">
              {founders.map((founder, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-300">{founder.name}</span>
                  <div className="flex gap-2">
                    {founder.linkedin && <SocialButton href={founder.linkedin} icon={Linkedin} size="sm" />}
                    {founder.twitter && <SocialButton href={founder.twitter} icon={Twitter} size="sm" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const SocialButton = ({ href, icon: Icon, size = "default" }: { href: string, icon: React.ElementType, size?: "sm" | "default" }) => (
  <Button variant="outline" size={size === "sm" ? "sm" : "icon"} asChild className="border-slate-800 hover:bg-slate-800/50">
    <Link href={href} target="_blank">
      <Icon className={`text-slate-400 hover:text-white ${size === "sm" ? "w-4 h-4" : "w-5 h-5"}`} />
    </Link>
  </Button>
);