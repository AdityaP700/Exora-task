// lib/types.ts

export type EventType = 'Funding' | 'Product Launch' | 'Layoffs' | 'Acquisition';

export interface ExecutiveCardData {
  pulseIndex: number;
  narrativeMomentum: number;
  sentimentScore: number;
  keyMetrics: {
    fundingStage?: string;
    employeeCount?: string;
  };
}

export interface BenchmarkMatrixRow {
  domain: string;
  pulseIndex: number;
  narrativeMomentum: number;
  sentimentScore: number;
}

export interface EventLogItem {
  date: string;
  type: EventType;
  headline: string;
}

export interface AiSummaryData {
  summary: string[]; // Array of 3 bullet points
  groqTlDr: string;
}

export interface BriefingResponse {
  requestDomain: string;
  executiveCard: ExecutiveCardData;
  benchmarkMatrix: BenchmarkMatrixRow[];
  eventLog: EventLogItem[];
  aiSummary: AiSummaryData;
}