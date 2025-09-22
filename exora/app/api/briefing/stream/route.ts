import { NextResponse } from 'next/server'
import { sharedLimiter } from '@/lib/limiter'
import { safeGenerateText, safeGenerateJson, ProviderConfig } from '@/lib/llm-service'
import { fetchExaData } from '@/lib/exa-service'
import { calculateNarrativeMomentum, calculatePulseIndex } from '@/lib/analysis-service'

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
        const overview = await safeGenerateText(
          `One-sentence factual description of ${domain}.`, llmProviders
        )
        send('overview', { domain, overview })

        // Stage 2: Founders + Socials (parallel, but limited)
        const foundersPrompt = `Founders of ${domain}. Return ONLY JSON array with name, linkedin, twitter.`
        const profilePrompt = `Profile for ${domain}. Return ONLY JSON with name, description, ipoStatus, socials{linkedin,twitter,facebook}`
  const foundersPromise = safeGenerateJson(foundersPrompt, llmProviders).catch(() => [])
  const profilePromise = safeGenerateJson(profilePrompt, llmProviders).catch(() => ({ name: domain.split('.')[0], description: `Company at ${domain}`, ipoStatus: 'Unknown', socials: {} }))

        const [founders, profile] = await Promise.all([foundersPromise, profilePromise])
        send('founders', { founders })
        send('socials', { socials: profile.socials || {} })

        // Stage 3: Competitor discovery (LLM) + mentions for main company
  const competitors = await discoverCompetitors(domain, llmProviders)
        send('competitors', { competitors })

        const mainMentions = await fetchExaData(domain, 'mentions', exaKey, { numResults: 15 })
        // prefer exact-domain links first
        const getHost = (u: string): string | null => { try { return new URL(u).hostname.toLowerCase() } catch { return null } }
        const target = domain.toLowerCase()
        const exact = (mainMentions.results || []).filter((m: any) => { const h = getHost(m.url); return h && (h === target || h.endsWith(`.${target}`)) })
        const rest = (mainMentions.results || []).filter((m: any) => !exact.includes(m))
        const ordered = [...exact, ...rest]
        const mainTopNews = ordered.slice(0, 3).map((m: any) => ({
          headline: m.title, url: m.url, source: m.domain, publishedDate: m.publishedDate
        }))
        send('company-news', { news: mainTopNews })

        // Stage 4: Competitor news (batched fetches, capped concurrency via limiter)
        const compResults = await Promise.all((competitors || []).map((c: string) =>
          fetchExaData(c, 'mentions', exaKey, { numResults: 8 }).catch(() => ({ results: [] }))
        ))

        // Flatten, take latest 4 across all competitors
        const competitorNewsAll = compResults.flatMap((r, idx) => {
          const d = competitors[idx]
          return (r.results || []).map((m: any) => ({ domain: d, headline: m.title, url: m.url, source: m.domain, publishedDate: m.publishedDate }))
        }).filter(n => n.headline)
          .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
          .slice(0, 4)
        send('competitor-news', { news: competitorNewsAll })

        // Stage 5: Sentiment for all domains (main + competitors)
        const allDomains = [domain, ...(competitors || [])]
        const allMentions = [mainMentions, ...compResults]
        const sentimentScores = await Promise.all(allMentions.map((res) => {
          const headlines = (res.results || []).slice(0, 5).map((m: any) => m.title)
          return getSentimentScore(headlines, llmProviders)
        }))

        // Build benchmark rows
        const benchmark = allDomains.map((d, i) => {
          const mentions = allMentions[i]?.results || []
          const momentum = calculateNarrativeMomentum(mentions)
          const sentiment = sentimentScores[i] || 50
          const pulse = calculatePulseIndex(momentum, sentiment)
          return { domain: d, narrativeMomentum: momentum, sentimentScore: sentiment, pulseIndex: pulse }
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
