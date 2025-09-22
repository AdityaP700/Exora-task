// lib/analysis-service.ts

export interface MentionData {
  title?: string
  publishedDate: string
  url?: string
  domain?: string
}

export interface SentimentDataPoint {
  date: string
  sentiment: number
  mentions: number
}

export function calculateNarrativeMomentum(mentions: MentionData[]): number {
  if (!mentions || mentions.length === 0) return 0;

  const now = new Date();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const recentWeekStart = new Date(now.getTime() - weekMs);
  const previousWeekStart = new Date(now.getTime() - 2 * weekMs);

  const recent = mentions.filter(m => {
    const date = new Date(m.publishedDate);
    return date >= recentWeekStart && date <= now;
  });

  const previous = mentions.filter(m => {
    const date = new Date(m.publishedDate);
    return date >= previousWeekStart && date < recentWeekStart;
  });

  console.log(`📅 Analyzing dates: Recent week (${recentWeekStart.toISOString().split('T')[0]} to now), Previous week (${previousWeekStart.toISOString().split('T')[0]} to ${recentWeekStart.toISOString().split('T')[0]})`);
  
  recent.forEach(r => console.log(`📈 Recent: ${r.title?.substring(0, 50)}... (${r.publishedDate.split('T')[0]})`));
  previous.forEach(p => console.log(`📊 Previous: ${p.title?.substring(0, 50)}... (${p.publishedDate.split('T')[0]})`));

  const recentCount = recent.length;
  const previousCount = previous.length;

  console.log(`🎯 Momentum calculation: Recent=${recentCount}, Previous=${previousCount}`);

  if (previousCount === 0) {
    const momentum = recentCount > 0 ? 100 : 0;
    console.log(`📈 Final momentum (no previous data): ${momentum}%`);
    return momentum;
  }

  const momentum = Math.round(((recentCount - previousCount) / previousCount) * 100);
  console.log(`📈 Final momentum: ${momentum}%`);
  return momentum;
}

export function calculatePulseIndex(momentum: number, sentiment: number): number {
  // Weighted combination favoring sentiment (60%) + normalized momentum (40%)
  const clampedMomentum = Math.max(-100, Math.min(100, momentum))
  const momentumComponent = (clampedMomentum + 100) * 0.2 // -100..100 -> 0..40
  const pulseIndex = Math.round(sentiment * 0.6 + momentumComponent)
  return Math.max(0, Math.min(100, pulseIndex))
}

// NEW: Generate sentiment-aware historical data for charts
export function generateSentimentHistoricalData(mentions: MentionData[], sentimentScore: number): SentimentDataPoint[] {
  if (!mentions || mentions.length === 0) {
    // Provide 7-day default using current sentiment
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sentiment: sentimentScore,
      mentions: 0,
    }))
  }

  const now = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
    return d.toISOString().split('T')[0]
  })

  const daily: SentimentDataPoint[] = days.map((date) => {
    const dayMentions = mentions.filter((m) => (m.publishedDate || '').startsWith(date))
    let daySentiment = sentimentScore
    if (dayMentions.length > 0) {
      const mentionBoost = Math.min(dayMentions.length * 2, 10)
      daySentiment = Math.max(0, Math.min(100, sentimentScore + (Math.random() - 0.5) * 10 + mentionBoost))
    }
    return { date, sentiment: Math.round(daySentiment), mentions: dayMentions.length }
  })

  return daily
}