// components/intelligence-feed.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BriefingResponse, BenchmarkMatrixRow } from "@/lib/types";
import Link from "next/link";
import { Globe } from "lucide-react";

export function IntelligenceFeed({ data }: { data: BriefingResponse }) {
  return (
    <Card className="bg-card border-border shadow-lg">
      <Tabs defaultValue="company-news" className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-slate-50">Intelligence Feed</CardTitle>
            <TabsList className="bg-slate-900 border-slate-800">
              <TabsTrigger value="company-news">Company Signals</TabsTrigger>
              <TabsTrigger value="competitor-news">Competitor News</TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value="company-news" className="space-y-4">
             {data.newsFeed.length > 0 ? data.newsFeed.map((item, i) => (
                <NewsItem key={i} {...item} />
             )) : <p className="text-slate-400 text-center py-4">No recent company signals found.</p>}
          </TabsContent>
          <TabsContent value="competitor-news" className="space-y-6">
            {data.benchmarkMatrix.slice(1).map(competitor => (
              <div key={competitor.domain}>
                <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400"/> {competitor.domain}
                </h4>
                <div className="space-y-3 border-l-2 border-slate-800 pl-4">
                  {competitor.news.length > 0 ? competitor.news.map((item, i) => (
                    <NewsItem key={i} {...item} />
                  )) : <p className="text-slate-400 text-sm">No recent news found.</p>}
                </div>
              </div>
            ))}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

const NewsItem = ({ headline, url, source, type, date }: { headline: string, url: string, source?: string, type?: string, date?: string }) => (
  <div className="group">
    <Link href={url} target="_blank" className="text-slate-300 group-hover:text-cyan-400 transition-colors">{headline}</Link>
    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
      {source ? (
        <span>{source}</span>
      ) : (
        <span>{date ? new Date(date).toLocaleDateString() : ''}</span>
      )}
      {type && type !== "Other" && (
        <>
          <span className="text-slate-700">•</span>
          <span className="font-medium text-cyan-400/70">{type}</span>
        </>
      )}
    </div>
  </div>
);

// Back-compat simple competitor news list used in Overview
export function CompetitorNews({ competitors }: { competitors: BenchmarkMatrixRow[] }) {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="text-sm font-semibold text-foreground mb-3">Competitor News</div>
      <div className="space-y-4">
        {competitors.slice(1).map((c) => (
          <div key={c.domain}>
            <div className="text-xs font-medium text-muted-foreground mb-1">{c.domain}</div>
            <div className="space-y-2">
              {c.news.length > 0 ? (
                c.news.map((n, i) => (
                  <NewsItem key={i} headline={n.headline} url={n.url} source={n.source} />
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No recent items for this competitor.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}