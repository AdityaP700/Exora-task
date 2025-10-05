// lib/constants.ts
// Centralized constants shared across server modules

export const TRUSTED_SOURCES_LIST: string[] = [
  'techcrunch.com',
  'wsj.com',
  'bloomberg.com',
  'forbes.com',
  'businessinsider.com',
  'reuters.com',
  'theverge.com',
  'nytimes.com',
  'ft.com',
  'wired.com',
  'cnbc.com',
  'cnn.com',
  'bbc.com',
];

export const TRUSTED_SOURCES = new Set<string>(TRUSTED_SOURCES_LIST);

export function isTrustedSource(hostname: string | undefined | null): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  if (TRUSTED_SOURCES.has(host)) return true;
  for (const base of TRUSTED_SOURCES_LIST) {
    if (host.endsWith(`.${base}`)) return true;
  }
  return false;
}


