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

// --- Enhanced sentiment transparency types ---
// These are optional, additive structures allowing the system to expose how a score was derived.
// They are backward compatible: existing sentimentScore remains primary until UI adopts enhancedSentiment.
export interface SentimentBreakdown {
  sourceCredibility: number      // 0-100 quality of sources (trusted vs long-tail)
  recencyWeight: number          // 0-100 weighting derived from how fresh coverage is
  volumeScore: number            // 0-100 scaled coverage density vs peers
  languageIntensity: number      // 0-100 strength/polarity of sentiment adjectives/verbs
  eventImpact: number            // 0-100 effect from impactful classified events (funding, layoffs, etc.)
  trendDirection: 'improving' | 'declining' | 'stable'
}

export interface EnhancedSentimentAnalysis {
  overallScore: number           // 0-100 – canonical sentiment (can mirror sentimentScore)
  confidence: number             // 0-100 – internal confidence based on data richness & consistency
  breakdown: SentimentBreakdown  // component subscores
  factors: string[]              // human-readable bullet factors (e.g. "Recent funding round lifted tone")
  dataQuality: 'high' | 'medium' | 'low' // heuristic based on volume, recency spread, source diversity
  analysisMethod: 'ai_enhanced' | 'basic' | 'fallback'
  lastUpdated: string            // ISO timestamp of computation
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
  // Optional enhanced sentiment transparency payload
  enhancedSentiment?: EnhancedSentimentAnalysis
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
  className : string
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