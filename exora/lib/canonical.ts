import cheerio from 'cheerio'
import { safeGenerateJson, safeGenerateText, ProviderConfig } from '@/lib/llm-service'

// In-memory cache for canonical info
interface CanonicalInfo { canonicalName: string; aliases: string[]; industryHint?: string; brandTokens: string[]; ts: number }
const TTL = 1000 * 60 * 60 // 1 hour
const cache: Record<string, CanonicalInfo> = (global as any).__exoraCanonicalCache || ((global as any).__exoraCanonicalCache = {})

async function fetchHtml(domain: string): Promise<string> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (ExoraBot CanonicalFetcher)' }, next: { revalidate: 300 } as any })
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  }
}

export async function getCanonicalInfo(domain: string, providers: ProviderConfig[]): Promise<Omit<CanonicalInfo,'ts'>> {
  const key = domain.toLowerCase()
  const now = Date.now()
  const cached = cache[key]
  if (cached && (now - cached.ts) < TTL) return { canonicalName: cached.canonicalName, aliases: cached.aliases, industryHint: cached.industryHint, brandTokens: cached.brandTokens }

  const html = await fetchHtml(domain)
  let title = '', metaDesc = '', siteName = '', h1 = ''
  if (html) {
    try {
      const $ = cheerio.load(html)
      title = $('title').first().text().trim()
      metaDesc = $('meta[name="description"]').attr('content') || ''
      siteName = $('meta[property="og:site_name"]').attr('content') || ''
      h1 = $('h1').first().text().trim()
    } catch {}
  }
  const context = { domain, title, metaDesc, siteName, h1 }
  const prompt = `You are inferring canonical company info from sparse web meta + domain.
Return ONLY valid JSON with keys: canonicalName (string), aliases (array of 2-6 short alternative names, include acronym if any), industryHint (string <= 60 chars), brandTokens (array of distinct tokens used to reference the company in news). Avoid hallucination; if unsure, keep arrays minimal. Domain: ${domain}. Context JSON: ${JSON.stringify(context)}`
  let data: any = {}
  try {
    data = await safeGenerateJson<any>(prompt, providers)
  } catch {
    try {
      const txt = await safeGenerateText(prompt, providers)
      const match = txt.match(/\{[\s\S]*\}/)
      if (match) data = JSON.parse(match[0])
    } catch {}
  }

  const canonicalName: string = (data?.canonicalName && typeof data.canonicalName === 'string') ? data.canonicalName.trim() : (siteName || title || domain.split('.')[0])
  const aliases: string[] = Array.isArray(data?.aliases) ? data.aliases.filter((a: any)=> typeof a === 'string').map((s: string)=> s.trim()).filter(Boolean).slice(0,6) : []
  if (!aliases.includes(canonicalName) && canonicalName.length < 80) aliases.unshift(canonicalName)
  const industryHint: string | undefined = typeof data?.industryHint === 'string' ? data.industryHint.slice(0,80) : undefined
  const brandTokens: string[] = Array.isArray(data?.brandTokens) ? data.brandTokens.filter((t: any)=> typeof t === 'string').map((s: string)=> s.trim()).filter(Boolean).slice(0,8) : []
  if (!brandTokens.length) {
    // derive fallback tokens from aliases
    brandTokens.push(...aliases.map(a=> a.split(/\s+/)[0]).filter(Boolean))
  }
  const result: CanonicalInfo = { canonicalName, aliases, industryHint, brandTokens, ts: now }
  cache[key] = result
  return { canonicalName, aliases, industryHint, brandTokens }
}
