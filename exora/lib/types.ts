// lib/types.ts

export type EventType = 'Funding' | 'Product Launch' | 'Layoffs' | 'Acquisition';

export interface HistoricalDataPoint {
  date: string;
  mentions: number;
}

// NEW: A richer structure for company info
export interface CompanyProfile {
  name: string;
  domain: string;
  description: string;
  ipoStatus: 'Public' | 'Private' | 'Unknown';
  socials: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

// NEW: A structure for founder info
export interface FounderInfo {
  name: string;
  linkedin?: string;
  twitter?: string;
}

// UPDATED: Competitor info now includes their own news
export interface BenchmarkMatrixRow {
  domain: string;
  pulseIndex: number;
  narrativeMomentum: number;
  sentimentScore: number;
  historicalData: HistoricalDataPoint[];
  news: { headline: string; url: string; source: string }[];
}

// NEW: A separate field for the primary company's news (formerly eventLog)
export interface NewsItem {
  date: string;
  type: EventType | 'Other';
  headline: string;
  url: string;
}

export interface AiSummaryData {
  summary: string[];
  groqTlDr: string;
}

// UPDATED: The main response object
export interface BriefingResponse {
  requestDomain: string;
  companyProfile: CompanyProfile;
  founderInfo: FounderInfo[];
  benchmarkMatrix: BenchmarkMatrixRow[];
  newsFeed: NewsItem[];
  aiSummary: AiSummaryData;
}