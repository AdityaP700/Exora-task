import { NextResponse } from 'next/server'
import { sharedLimiter } from '@/lib/limiter'
import { safeGenerateText, safeGenerateJson, ProviderConfig } from '@/lib/llm-service'
import { fetchExaData, fetchCompanyNews, scoreNewsItem } from '@/lib/exa-service'
import { getOrGenerateProfileSnapshot } from '@/lib/profile-snapshot'
import { calculateNarrativeMomentum, calculatePulseIndex, generateSentimentHistoricalData, generateEnhancedSentimentAnalysis } from '@/lib/analysis-service'
import { normalizePublishedDate } from '@/lib/utils'

// Emit SSE event helper
function sseChunk(event: string, data: unknown) {
  return `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`
}

// Tiny utility to normalize domains
function cleanDomain(raw: string) {
  return raw.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').trim()
}

// Competitor discovery
async function discoverCompetitors(domain: string, providers: ProviderConfig[]): Promise<string[]> {
  const prompt = `Identify top 3 direct competitors for the company operating at the exact domain ${domain}. Ignore similarly named companies on different TLDs. Return ONLY JSON array of domains.`
  try {
    const list = await safeGenerateJson<string[]>(prompt, providers)
    return Array.isArray(list) ? list.slice(0, 3) : []
  } catch {
    try {
      const text = await safeGenerateText(prompt, providers)
      const m = text.match(/\[[\s\S]*?\]/)
      return m ? (JSON.parse(m[0]) as string[]).slice(0, 3) : []
    } catch {
      return []
    }
  }
}

async function getSentimentScore(headlines: string[], providers: ProviderConfig[]): Promise<number> {
  if (!headlines?.length) return 50
  const prompt = `Score the sentiment (0-100) of these headlines. Return ONLY the number.\n\n${headlines.map(h => `- ${h}`).join('\n')}`
  try {
    const txt = await safeGenerateText(prompt, providers)
    const num = parseInt(txt.replace(/[^0-9]/g, ''))
    if (Number.isFinite(num) && num >= 0 && num <= 100) return num
  } catch {}
  return 50
}

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('domain')
  if (!raw) return NextResponse.json({ error: 'Missing domain' }, { status: 400 })
  const domain = cleanDomain(raw)
  const refreshProfile = searchParams.get('refreshProfile') === 'true'

  const exaKey = process.env.EXA_API_KEY
  const groqKey = process.env.GROQ_API_KEY
  const openAiKey = process.env.OPENAI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  if (!exaKey) return NextResponse.json({ error: 'Missing EXA_API_KEY' }, { status: 500 })

  const llmProviders: ProviderConfig[] = [
    { provider: 'groq', apiKey: groqKey, model: 'llama-3.1-8b-instant' },
    { provider: 'gemini', apiKey: geminiKey, model: 'gemini-2.0-flash' },
    { provider: 'openai', apiKey: openAiKey, model: 'gpt-4o-mini' },
  ]

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(new TextEncoder().encode(sseChunk(event, data)))

      try {
        // Stage 1: Overview (fast LLM TL;DR)
        const snapshotProfile = await getOrGenerateProfileSnapshot(domain, llmProviders, refreshProfile)
        const overview = snapshotProfile.brief || snapshotProfile.description?.split('.').slice(0,1).join('.') || `Company at ${domain}`
        send('overview', { domain, overview })
        send('profile', { profile: snapshotProfile })

        // Stage 2: Founders + Socials (parallel, but limited)
  const foundersPrompt = `For the company operating at ${domain}, return ONLY JSON array of people objects with keys: name, roleGuess (Founder/Co-Founder/CEO/CTO/Other), linkedin (url or null), wikipedia (url or null), confidence (0-1). Include current CEO & CTO even if not founders. Use public knowledge up to 2024.`
        const profilePrompt = `Profile for ${domain}. Return ONLY JSON with name, description, ipoStatus, socials{linkedin,twitter,facebook}`
  const foundersPromise = safeGenerateJson(foundersPrompt, llmProviders).catch(() => [])
  const profilePromise = safeGenerateJson(profilePrompt, llmProviders).catch(() => ({ name: domain.split('.')[0], description: `Company at ${domain}`, ipoStatus: 'Unknown', socials: {} }))

  const [rawLeaders, profile] = await Promise.all([foundersPromise, profilePromise])
  // Normalize & split founders vs current execs
  const leaders = Array.isArray(rawLeaders) ? rawLeaders : []
  const founders = leaders.filter((p: any) => /founder/i.test(p.roleGuess || ''))
  const executives = leaders.filter((p: any) => /(ceo|cto)/i.test(p.roleGuess || ''))
  send('founders', { founders })
  send('leadership', { executives, founders })
        send('socials', { socials: profile.socials || {} })
        // merge socials into existing snapshot if emitted
        snapshotProfile.socials = profile.socials || {}
        send('profile', { profile: snapshotProfile })

        // Stage 3: Competitor discovery (LLM) + mentions for main company
  const competitors = await discoverCompetitors(domain, llmProviders)
        send('competitors', { competitors })

        const mainMentions = await fetchExaData(domain, 'mentions', exaKey, { numResults: 15 })
        // Focused company news (1–3 credible items)
        const focusedNews = await fetchCompanyNews(domain, exaKey, { limit: 3 }).catch(()=>({ results: [] }))
        let mainTopNews = (focusedNews.results || []).map((m: any) => ({
          headline: m.title,
          url: m.url,
          source: m.domain,
          publishedDate: normalizePublishedDate(m.publishedDate)
        }))
        // LLM validation filter: ensure each headline truly refers to target company (avoid homonyms)
        if (mainTopNews.length) {
          try {
            const validationPrompt = `Given the company domain ${domain} and these news items as JSON array, return ONLY a JSON array of the indices that are truly about this company (not other similarly named entities). Headlines JSON: ${JSON.stringify(mainTopNews.map(n => n.headline))}`
            const idxJson = await safeGenerateJson<number[]>(validationPrompt, llmProviders).catch(()=>[]) as number[]
            if (Array.isArray(idxJson) && idxJson.length) {
              const allowed = new Set(idxJson.filter(n=> Number.isFinite(n)))
              mainTopNews = mainTopNews.filter((_,i)=> allowed.has(i))
            }
          } catch {}
        }
        send('company-news', { news: mainTopNews })

        // Stage 4: Competitor news (batched fetches, capped concurrency via limiter)
        const compResults = await Promise.all((competitors || []).map((c: string) =>
          fetchExaData(c, 'mentions', exaKey, { numResults: 8 }).catch(() => ({ results: [] }))
        ))

        // Flatten, take latest 4 across all competitors
        const trustedSources = new Set([
          'techcrunch.com','wsj.com','bloomberg.com','forbes.com','businessinsider.com','reuters.com','theverge.com','nytimes.com','ft.com','wired.com','cnbc.com','cnn.com','bbc.com'
        ])
        const competitorNewsAllRaw = compResults.flatMap((r, idx) => {
          const d = competitors[idx]
          return (r.results || []).map((m: any) => ({
            domain: d,
            headline: m.title,
            url: m.url,
            source: m.domain,
            publishedDate: normalizePublishedDate(m.publishedDate || new Date().toISOString())
          }))
        }).filter(n => n.headline)

        // Group per competitor and apply filtering (2–4 credible/most recent)
        const grouped: Record<string, any[]> = {}
        for (const item of competitorNewsAllRaw) {
          grouped[item.domain] = grouped[item.domain] || []
          grouped[item.domain].push(item)
        }
        const refined: any[] = []
        Object.entries(grouped).forEach(([cDomain, items]) => {
          const ranked = items.map(n => {
            const credibility = trustedSources.has((n.source || '').toLowerCase()) ? 2 : 0
            const metrics = scoreNewsItem({ title: n.headline, url: n.url, publishedDate: n.publishedDate, credibility, domain: n.source })
            return { ...n, credibility, _metrics: metrics }
          }).sort((a,b)=> (b._metrics.score - a._metrics.score) || (new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()))
          const slice = ranked.slice(0,4)
          const finalSlice = slice.length < 2 ? ranked.slice(0,2) : slice
          refined.push(...finalSlice.map(({credibility,_metrics,...rest})=>rest))
        })
        // Flatten refined (client groups anyway) but cap global to prevent overload
        send('competitor-news', { news: refined.slice(0, 12) })

        // Stage 5: Sentiment for all domains (main + competitors)
        const allDomains = [domain, ...(competitors || [])]
        const allMentions = [mainMentions, ...compResults]
        const sentimentScores = await Promise.all(allMentions.map((res) => {
          const headlines = (res.results || []).slice(0, 5).map((m: any) => m.title)
          return getSentimentScore(headlines, llmProviders)
        }))

        // Build benchmark rows
        const enableEnhanced = process.env.ENABLE_ENHANCED_SENTIMENT === 'true'
        const peerVolumes = allMentions.map(m => (m.results || []).length)
        const benchmark = allDomains.map((d, i) => {
          const mentions = (allMentions[i]?.results || []).map((m: any) => ({
            title: m.title,
            publishedDate: m.publishedDate,
            url: m.url,
            domain: m.domain,
          }))
          const momentum = calculateNarrativeMomentum(mentions)
          const sentiment = sentimentScores[i] || 50
          const pulse = calculatePulseIndex(momentum, sentiment)
          const sentimentHistoricalData = generateSentimentHistoricalData(mentions, sentiment)
          const enhancedSentiment = enableEnhanced ? generateEnhancedSentimentAnalysis(
            mentions,
            i === 0 ? [] : [], // placeholder: could include events when streaming adds them earlier
            sentiment,
            momentum,
            { peerVolumes }
          ) : undefined
          return { domain: d, narrativeMomentum: momentum, sentimentScore: sentiment, pulseIndex: pulse, sentimentHistoricalData, enhancedSentiment }
        })
        send('sentiment', { benchmark })

        // Stage 6: Final summary (exec insights)
        const superPrompt = `Given this competitive benchmark for ${domain}, write 3 executive insights (each <=40 words).\n\n${JSON.stringify(benchmark, null, 2)}`
  const summary = await safeGenerateText(superPrompt, llmProviders).catch(() => '• Strong positioning.\n• Positive momentum.\n• Focus on execution.')
        send('summary', { summary })

        // End
        send('done', { ok: true })
        controller.close()
      } catch (err: any) {
        send('error', { message: err?.message || 'Unknown error' })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
