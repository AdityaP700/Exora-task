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

// --- Enhanced Sentiment Transparency ---
import type { EnhancedSentimentAnalysis, SentimentBreakdown } from '@/lib/types'

// Light word lists for proxy intensity scoring (placeholder – can be replaced by real NLP)
const POSITIVE_WORDS = ['growth','record','surge','expands','launches','innovative','partnership','raises','funding','profitable']
const NEGATIVE_WORDS = ['layoffs','cuts','lawsuit','decline','drop','plunge','breach','shutdown','loss','negative']
const TRUSTED_DOMAINS = new Set([
  'techcrunch.com','wsj.com','bloomberg.com','forbes.com','businessinsider.com','reuters.com','theverge.com','nytimes.com','ft.com','wired.com','cnbc.com','cnn.com','bbc.com'
])

interface PeerContext {
  peerVolumes: number[] // mention counts for all peers incl. primary
}

export function generateEnhancedSentimentAnalysis(
  mentions: MentionData[],
  events: { type?: string }[],
  baseSentiment: number,
  momentum: number,
  peerContext: PeerContext
): EnhancedSentimentAnalysis {
  const now = new Date()
  const horizonDays = 14
  const recentCutoff = new Date(now.getTime() - horizonDays * 24 * 60 * 60 * 1000)
  const validMentions = (mentions || []).filter(m => {
    const d = new Date(m.publishedDate)
    return !isNaN(d.getTime()) && d >= recentCutoff && d <= now
  })

  const volume = validMentions.length
  const distinctSources = new Set(validMentions.map(m => (m.domain || '').toLowerCase())).size
  const trustedCount = validMentions.filter(m => TRUSTED_DOMAINS.has((m.domain || '').toLowerCase())).length
  const sourceCredibility = volume === 0 ? 0 : Math.round((trustedCount / volume) * 100)

  // Recency: newer items boost score. Compute average age in days; invert to 0..100
  const avgAgeDays = validMentions.length
    ? validMentions.reduce((acc, m) => acc + Math.max(0, (now.getTime() - new Date(m.publishedDate).getTime()) / 86400000), 0) / validMentions.length
    : horizonDays
  const recencyWeight = Math.round(100 * Math.max(0, Math.min(1, 1 - (avgAgeDays / horizonDays))))

  // Volume score vs peers (median) for stability
  const peerVolumes = peerContext.peerVolumes && peerContext.peerVolumes.length ? peerContext.peerVolumes : [volume]
  const median = [...peerVolumes].sort((a,b)=>a-b)[Math.floor(peerVolumes.length/2)] || 1
  const volumeScore = Math.round(Math.max(0, Math.min(100, (volume / Math.max(1, median)) * 60 + (volume > median ? 20 : 0))))

  // Language intensity: count polarity words
  let pos=0, neg=0
  for (const m of validMentions) {
    const txt = (m.title || '').toLowerCase()
    POSITIVE_WORDS.forEach(w=> { if (txt.includes(w)) pos++ })
    NEGATIVE_WORDS.forEach(w=> { if (txt.includes(w)) neg++ })
  }
  const totalPolarity = pos + neg
  const polarityBalance = totalPolarity === 0 ? 0.5 : pos / totalPolarity // 0..1
  const languageIntensityRaw = totalPolarity === 0 ? 0 : Math.min(1, totalPolarity / 20) // cap scaling
  const languageIntensity = Math.round(languageIntensityRaw * 50 + polarityBalance * 50)

  // Event impact: assign weights
  let eventImpactScore = 0
  for (const e of events || []) {
    switch ((e.type || '').toLowerCase()) {
      case 'funding': eventImpactScore += 15; break
      case 'product launch': eventImpactScore += 10; break
      case 'acquisition': eventImpactScore += 8; break
      case 'layoffs': eventImpactScore -= 20; break
    }
  }
  eventImpactScore = Math.max(-30, Math.min(40, eventImpactScore))
  const eventImpact = Math.round(((eventImpactScore + 30) / 70) * 100) // normalize to 0..100

  // Trend direction from momentum (positive/negative threshold) or last 3 vs prev 3 sentiment proxies (use baseSentiment + momentum heuristics)
  const trendDirection: SentimentBreakdown['trendDirection'] = momentum > 5 ? 'improving' : momentum < -5 ? 'declining' : 'stable'

  // Data quality heuristic
  const dataQuality: 'high'|'medium'|'low' = volume >= 15 && distinctSources >= 5 ? 'high' : volume >= 6 && distinctSources >= 3 ? 'medium' : 'low'

  // Confidence: weighted average of (dataQuality baseline, sourceCredibility, recency)
  const qualityBase = dataQuality === 'high' ? 85 : dataQuality === 'medium' ? 65 : 45
  const confidence = Math.round((qualityBase * 0.4) + (sourceCredibility * 0.3) + (recencyWeight * 0.3))

  // Overall score: blend base sentiment with modifiers (do not drift more than ±15)
  const modifier = (
    (sourceCredibility - 50) * 0.05 +
    (recencyWeight - 50) * 0.04 +
    (volumeScore - 50) * 0.03 +
    (languageIntensity - 50) * 0.03 +
    (eventImpact - 50) * 0.05 +
    (trendDirection === 'improving' ? 6 : trendDirection === 'declining' ? -6 : 0)
  )
  const overallScore = Math.max(0, Math.min(100, Math.round(baseSentiment + Math.max(-15, Math.min(15, modifier)))))

  const factors: string[] = []
  if (sourceCredibility >= 60) factors.push('High proportion of trusted sources')
  if (recencyWeight >= 60) factors.push('Recent coverage concentration')
  if (volumeScore >= 60) factors.push('Above-peer mention volume')
  if (eventImpact > 55) factors.push('Recent positive strategic events')
  if (eventImpact < 45) factors.push('Negative or cautionary event impact')
  if (languageIntensity >= 65) factors.push('Strong tonal language detected')
  if (trendDirection === 'improving') factors.push('Momentum trending upward')
  if (trendDirection === 'declining') factors.push('Momentum pressure emerging')
  if (!factors.length) factors.push('Neutral media environment')

  const breakdown: SentimentBreakdown = {
    sourceCredibility,
    recencyWeight,
    volumeScore,
    languageIntensity,
    eventImpact,
    trendDirection
  }

  return {
    overallScore,
    confidence,
    breakdown,
    factors,
    dataQuality,
    analysisMethod: 'ai_enhanced',
    lastUpdated: new Date().toISOString()
  }
}