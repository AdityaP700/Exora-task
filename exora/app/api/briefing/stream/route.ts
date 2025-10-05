import { NextResponse } from 'next/server'
import { sharedLimiter } from '@/lib/limiter'
import { safeGenerateText, safeGenerateJson, ProviderConfig } from '@/lib/llm-service'
import { fetchExaData, scoreNewsItem, exaAdHocSearch } from '@/lib/exa-service'
import { TRUSTED_SOURCES as TRUSTED_SOURCES_SET, isTrustedSource } from '@/lib/constants'
import { getCanonicalInfo } from '@/lib/canonical'
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

  // 1) Try LLM fast path
  const prompt = `Score the sentiment (0-100) of these headlines. Return ONLY the number.\n\n${headlines.map(h => `- ${h}`).join('\n')}`
  try {
    const txt = await safeGenerateText(prompt, providers)
    const num = parseInt(txt.replace(/[^0-9]/g, ''))
    if (Number.isFinite(num) && num >= 0 && num <= 100) return num
  } catch {}

  // 2) Deterministic lexical fallback (ensures non-flat variation without LLM)
  const POS = ['growth','record','surge','expand','expands','launch','launches','innovative','partnership','raises','funding','profit','profitable','beat','beats','up','acquire','acquires','strong','improve','improves']
  const NEG = ['layoff','layoffs','cut','cuts','lawsuit','decline','drop','plunge','breach','shutdown','loss','negative','down','fraud','issue','issues','risk','risks','weak','slow','slows']
  let pos = 0, neg = 0
  for (const h of headlines) {
    const lower = (h||'').toLowerCase()
    POS.forEach(w=> { if (lower.includes(w)) pos++ })
    NEG.forEach(w=> { if (lower.includes(w)) neg++ })
  }
  const total = pos + neg
  if (total === 0) return 50 // truly neutral fallback
  // Center at 50, scale polarity to ±35, add mild volume boost capped
  const polarity = (pos - neg) / total // -1..1
  const volumeBoost = Math.min(10, Math.log2(headlines.length + 1) * 3) // 0..~10
  const score = Math.round(50 + polarity * 35 + volumeBoost * (polarity >= 0 ? 0.4 : -0.4))
  return Math.max(0, Math.min(100, score))
}

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('domain')
  if (!raw) return NextResponse.json({ error: 'Missing domain' }, { status: 400 })
  const domain = cleanDomain(raw)
  // Dynamic canonical inference structure
  let canonical: { canonicalName: string; aliases: string[]; industryHint?: string; brandTokens?: string[] } | null = null
  const refreshProfile = searchParams.get('refreshProfile') === 'true'

  // BYOK: decode optional keys param (base64url JSON { exa, groq, gemini, openai })
  let userKeys: Partial<Record<'exa'|'groq'|'gemini'|'openai', string>> = {}
  const keysParam = searchParams.get('keys')
  if (keysParam) {
    try {
      const padded = keysParam.replace(/-/g,'+').replace(/_/g,'/')
      const json = decodeURIComponent(Buffer.from(padded, 'base64').toString('utf8'))
    } catch {}
    try {
      // Second attempt: direct base64url decode without decodeURIComponent
      const normalized = keysParam.replace(/-/g,'+').replace(/_/g,'/')
      const buf = Buffer.from(normalized, 'base64')
      const raw = buf.toString('utf8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        userKeys = parsed
      }
    } catch {}
  }

  const exaKey = (userKeys.exa || process.env.EXA_API_KEY || '').trim()
  const groqKey = (userKeys.groq || process.env.GROQ_API_KEY || '').trim()
  const openAiKey = (userKeys.openai || process.env.OPENAI_API_KEY || '').trim()
  const geminiKey = (userKeys.gemini || process.env.GEMINI_API_KEY || '').trim()

  if (!exaKey) return NextResponse.json({ error: 'Missing Exa API key' }, { status: 400 })

  const llmProviders: ProviderConfig[] = []
  if (groqKey) llmProviders.push({ provider: 'groq', apiKey: groqKey, model: 'llama-3.1-8b-instant' })
  if (geminiKey) llmProviders.push({ provider: 'gemini', apiKey: geminiKey, model: 'gemini-2.0-flash' })
  if (openAiKey) llmProviders.push({ provider: 'openai', apiKey: openAiKey, model: 'gpt-4o-mini' })
  // If user provided no LLM keys, llmProviders remains empty; downstream safeGenerate* functions should degrade gracefully

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(new TextEncoder().encode(sseChunk(event, data)))

      try {
        // Stage 0: Canonical inference (disambiguation & alias surface)
        try {
          canonical = await getCanonicalInfo(domain, llmProviders)
          send('canonical', { canonical })
        } catch {}

        // Stage 1: Overview (fast LLM TL;DR)
        const snapshotProfile = await getOrGenerateProfileSnapshot(domain, llmProviders, refreshProfile)
        // Attach canonical enrichment: only override if snapshot name looks like raw domain stem or is very short (<4 chars)
        if (canonical) {
          const baseStem = domain.split('.')[0].toLowerCase()
          const currentName = (snapshotProfile.name || '').trim()
          const looksGeneric = !currentName || currentName.toLowerCase() === baseStem || currentName.length < 4
          if (looksGeneric && canonical.canonicalName) {
            snapshotProfile.name = canonical.canonicalName
          }
          snapshotProfile.canonicalName = canonical.canonicalName
          snapshotProfile.aliases = canonical.aliases
          if (!snapshotProfile.industry && canonical.industryHint) {
            snapshotProfile.industry = canonical.industryHint
          }
        }
        const overview = snapshotProfile.brief || snapshotProfile.description?.split('.').slice(0,1).join('.') || `Company at ${domain}`
        send('overview', { domain, overview })
        send('profile', { profile: snapshotProfile })

        // Stage 2: Founders + Socials (parallel, but limited)
        const foundersPrompt = `For the company operating at ${domain}${canonical ? ` (canonical name: ${canonical.canonicalName}; aliases: ${canonical.aliases.join(', ')})` : ''}, return ONLY JSON array of people objects with keys: name, roleGuess (Founder/Co-Founder/CEO/CTO/Director/Other), linkedin (url or null), wikipedia (url or null), confidence (0-1). Ensure the current CEO is included; if no CTO publicly known include a senior technology leader (e.g., CTO-equivalent) or a Director if relevant. Use public knowledge up to 2024.`
        const profilePrompt = `Profile for ${domain}${canonical ? ` (canonical name: ${canonical.canonicalName})` : ''}. Return ONLY JSON with name, description, ipoStatus, socials{linkedin,twitter,facebook}`
  const foundersPromise = safeGenerateJson(foundersPrompt, llmProviders).catch(() => [])
  const profilePromise = safeGenerateJson(profilePrompt, llmProviders).catch(() => ({ name: domain.split('.')[0], description: `Company at ${domain}`, ipoStatus: 'Unknown', socials: {} }))

  const [rawLeaders, profile] = await Promise.all([foundersPromise, profilePromise])
  // Normalize & split founders vs current execs
  let leaders = Array.isArray(rawLeaders) ? rawLeaders : []
  // guarantee CEO presence with fallback heuristic if missing
  const hasCEO = leaders.some((p: any) => /ceo/i.test(p.roleGuess || ''))
  if (!hasCEO && canonical) {
    // attempt a lightweight CEO fetch
    try {
      const ceoText = await safeGenerateText(`Who is the current CEO of ${canonical.canonicalName}? Return ONLY the name.`, llmProviders)
      const name = ceoText.split(/\n|,|-/)[0].trim().slice(0,120)
      if (name && !leaders.some((l: any)=> l.name?.toLowerCase() === name.toLowerCase())) {
        leaders.push({ name, roleGuess: 'CEO', linkedin: null, wikipedia: null, confidence: 0.55 })
      }
    } catch {}
  }
  const founders = leaders.filter((p: any) => /founder/i.test(p.roleGuess || ''))
  const executives = leaders.filter((p: any) => /(ceo|cto|director)/i.test(p.roleGuess || ''))
  send('founders', { founders })
  send('leadership', { executives, founders })
        send('socials', { socials: profile.socials || {} })
        // merge socials into existing snapshot if emitted
        snapshotProfile.socials = profile.socials || {}
        let mainMentions = await fetchExaData(domain, 'mentions', exaKey, { numResults: 25 })
        // Stage 3: Competitor discovery (LLM) + mentions for main company
  const competitors = await discoverCompetitors(domain, llmProviders)
        send('competitors', { competitors })
        // Re-score + disambiguation filter: keep only items referencing aliases unless from trusted source
        const TRUSTED_SOURCES = Array.from(TRUSTED_SOURCES_SET)
        const MIN_MENTIONS = 8
        if (canonical && mainMentions?.results?.length) {
          const original = [...mainMentions.results]
          const aliasRegex = new RegExp(`\\b(${canonical.aliases.map((a: string)=>a.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')).join('|')})\\b`, 'i')
          mainMentions.results = mainMentions.results.filter((r: any) => {
            if (!r.title) return false
            const host = (()=>{ try { return new URL(r.url).hostname.toLowerCase() } catch { return '' } })()
            if (TRUSTED_SOURCES.includes(host)) return true
            return aliasRegex.test(r.title || '')
          })
          // If filtering became too aggressive, fall back to original
          if (mainMentions.results.length < Math.min(3, original.length)) {
            mainMentions.results = original
          }
        }
        // Query expansion if still low recall
        if (canonical && (!mainMentions?.results || mainMentions.results.length < MIN_MENTIONS)) {
          try {
            const expansionPrompt = `Given canonical company name ${canonical.canonicalName} and aliases ${canonical.aliases.join(', ')}, propose 3 concise alternative news search queries (no quotes) focusing on recent strategic moves, funding, partnerships or expansions. Return ONLY JSON array of strings.`
            const queries = await safeGenerateJson<string[]>(expansionPrompt, llmProviders).catch(()=>[])
            const extraResults: any[] = []
            if (Array.isArray(queries)) {
              for (const q of queries.slice(0,3)) {
                try {
                  const res = await exaAdHocSearch(exaKey, `${q} ${canonical.canonicalName}`, 6)
                  if (res?.results) extraResults.push(...res.results)
                } catch {}
              }
            }
            if (extraResults.length) {
              const seen = new Set((mainMentions.results || []).map((r: any)=> r.url))
              const merged = [...(mainMentions.results || [])]
              for (const r of extraResults) {
                if (!r.url || seen.has(r.url)) continue
                seen.add(r.url)
                merged.push(r)
              }
              mainMentions.results = merged
            }
          } catch {}
        }
        // Derive company news similarly to competitor approach (rank & slice)
        const trustedSources = new Set<string>(Array.from(TRUSTED_SOURCES_SET))
        interface MainNews { headline: string; url: string; source: string; publishedDate: string; credibility?: number; _metrics?: any }
        let mainTopNews: MainNews[] = (mainMentions.results || []).map((m: any): MainNews => ({
          headline: m.title,
          url: m.url,
          source: m.domain,
          publishedDate: normalizePublishedDate(m.publishedDate || new Date().toISOString()),
          credibility: isTrustedSource(m.domain) ? 2 : 0
        }))
          .map((n: MainNews) => ({ ...n, _metrics: scoreNewsItem({ title: n.headline, url: n.url, publishedDate: n.publishedDate, credibility: n.credibility, domain: n.source }) }))
          .sort((a: MainNews, b: MainNews)=> (b._metrics.score - a._metrics.score) || (new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()))
          .slice(0,6)
          .map(({_metrics, credibility, ...rest}: any)=> rest as MainNews)
        // LLM validation filter: ensure each headline truly refers to target company (avoid homonyms)
        if (mainTopNews.length) {
          try {
            const validationPrompt = `Given the company domain ${domain} and these news items as JSON array, return ONLY a JSON array of the indices that are truly about this company (not other similarly named entities). Headlines JSON: ${JSON.stringify(mainTopNews.map((n: MainNews) => n.headline))}`
            const idxJson = await safeGenerateJson<number[]>(validationPrompt, llmProviders).catch(()=>[]) as number[]
            if (Array.isArray(idxJson) && idxJson.length) {
              const allowed = new Set(idxJson.filter(n=> Number.isFinite(n)))
              mainTopNews = mainTopNews.filter((_,i: number)=> allowed.has(i))
            }
          } catch {}
        }
        send('company-news', { news: mainTopNews })

        // Stage 4: Competitor news (batched fetches, capped concurrency via limiter)
        const compResults = await Promise.all((competitors || []).map((c: string) =>
          fetchExaData(c, 'mentions', exaKey, { numResults: 8 }).catch(() => ({ results: [] }))
        ))

        // Flatten, take latest 4 across all competitors
        const trustedSourcesComp = new Set(Array.from(TRUSTED_SOURCES_SET))
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
            const credibility = isTrustedSource(n.source) ? 2 : 0
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

  // Stage 6: Descriptive executive summary
  const summaryPrompt = `You are generating an executive competitive briefing. Provide:
1) A one-sentence positioning statement (~22 words) about the company at ${domain} referencing industry & differentiation if evident.
2) Three strategic bullets (each <=30 words) capturing momentum, risks or opportunities grounded in benchmark sentiment & momentum.
3) One short competitive lens sentence (<25 words) comparing it to peers.
Return ONLY plain text lines prefixed with • for bullets, and no extra commentary.
Context JSON:
PROFILE: ${JSON.stringify(snapshotProfile)}
LEADERSHIP: ${JSON.stringify({ executives: executives?.slice?.(0,4), founders: founders?.slice?.(0,4) })}
BENCHMARK: ${JSON.stringify(benchmark.slice(0,5))}
NEWS: ${JSON.stringify(mainTopNews.slice(0,4))}`
  const summary = await safeGenerateText(summaryPrompt, llmProviders).catch(() => '• Positioning: solid presence with emerging competitive signals.\n• Momentum stable vs peers.\n• Opportunity: sharpen differentiation narrative.\n• Peer lens: sentiment parity, differentiation moderate.')
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
