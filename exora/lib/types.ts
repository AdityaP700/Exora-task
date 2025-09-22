// lib/types.ts - Updated with sentiment data types

export type EventType = "Funding" | "Product Launch" | "Acquisition" | "Layoffs"

export interface CompanyProfile {
  name: string
  domain: string
  description: string
  ipoStatus: "Public" | "Private" | "Unknown"
  socials: {
    linkedin?: string
    twitter?: string
    facebook?: string
  }
}

export interface FounderInfo {
  name: string
  linkedin?: string
  twitter?: string
}

export interface NewsItem {
  headline: string
  url: string
  source: string
  publishedDate: string,
  date : string
  type?: EventType | "Other"
}

export interface HistoricalDataPoint {
  date: string
  mentions: number
}

export interface SentimentHistoricalDataPoint {
  date: string
  sentiment: number
  mentions: number
}

export interface BenchmarkMatrixItem {
  domain: string
  pulseIndex: number
  narrativeMomentum: number
  sentimentScore: number
  historicalData: HistoricalDataPoint[]
  sentimentHistoricalData?: SentimentHistoricalDataPoint[] // NEW: Sentiment-aware historical data
  news: NewsItem[]
  BenchmarkRank?: number
}

export interface EventLogItem {
  date: string
  headline: string
  type: EventType | "Other"
  url: string
}

export interface AiSummaryData {
  summary: string[]
  groqTlDr: string
}

export interface BriefingResponse {
  requestDomain: string
  companyProfile: CompanyProfile
  founderInfo: FounderInfo[]
  benchmarkMatrix: BenchmarkMatrixItem[]
  newsFeed: EventLogItem[]
  aiSummary: AiSummaryData
}

// Additional utility types for chart components
export interface ChartDataPoint {
  label: string
  value: number
}

export interface SentimentAnalysisResult {
  sentimentScore: number
  momentum: number
  historicalData: SentimentHistoricalDataPoint[]
  summary: string[]
}