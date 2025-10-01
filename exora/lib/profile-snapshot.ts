import { CompanyProfile } from '@/lib/types'
import { safeGenerateJson, safeGenerateText, ProviderConfig } from '@/lib/llm-service'

// Simple in-memory cache (per server instance)
interface SnapshotCacheEntry { profile: CompanyProfile; ts: number }
const SNAPSHOT_TTL_MS = 1000 * 60 * 60 // 1 hour
const globalCache: Record<string, SnapshotCacheEntry> = (global as any).__exoraProfileCache || ((global as any).__exoraProfileCache = {})

export async function getOrGenerateProfileSnapshot(domain: string, providers: ProviderConfig[], forceRefresh = false): Promise<CompanyProfile> {
  const key = domain.toLowerCase()
  const now = Date.now()
  if (!forceRefresh) {
    const cached = globalCache[key]
    if (cached && (now - cached.ts) < SNAPSHOT_TTL_MS) {
      return cached.profile
    }
  }

  const overview = await safeGenerateText(`One-sentence factual description of the company operating at ${domain}.`, providers).catch(()=>`Company at ${domain}`)
  const snapshotPrompt = `Return ONLY valid JSON with keys: name, industry, foundedYear, headquarters, headcountRange, employeeCount (integer, approximate current total employees worldwide if publicly known), brief(<=160 chars), description(<=320 chars), ipoStatus(Public|Private|Unknown). Domain: ${domain}. If unknown, omit field or use null. Do NOT fabricate precision.`
  let raw: any = {}
  try { raw = await safeGenerateJson<any>(snapshotPrompt, providers) } catch {}

  // Base profile; canonical enrichment (name/aliases) applied later in route if needed
  const profile: CompanyProfile = {
    name: raw?.name || domain.split('.')[0],
    domain,
    description: raw?.description || overview,
    ipoStatus: (raw?.ipoStatus === 'Public' || raw?.ipoStatus === 'Private') ? raw.ipoStatus : 'Unknown',
    socials: {},
    industry: raw?.industry,
    foundedYear: raw?.foundedYear?.toString(),
    headquarters: raw?.headquarters,
    headcountRange: raw?.headcountRange,
    employeeCountApprox: (typeof raw?.employeeCount === 'number' && raw.employeeCount > 0) ? Math.round(raw.employeeCount) : undefined,
    brief: raw?.brief || overview,
    logoUrl: `https://logo.clearbit.com/${domain}`,
    lastUpdated: new Date().toISOString()
  }

  globalCache[key] = { profile, ts: now }
  return profile
}
