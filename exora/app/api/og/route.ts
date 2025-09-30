import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'edge';

// Simple in-memory LRU-ish cache (bounded by MAX_ITEMS) with TTL (ms)
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const MAX_ITEMS = 500;
type CacheEntry = { imageUrl: string | null; expires: number };
const cache: Map<string, CacheEntry> = new Map();

function getCached(url: string): string | null | undefined {
  const entry = cache.get(url);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(url);
    return undefined;
  }
  return entry.imageUrl; // can be null meaning previously not found
}

function setCached(url: string, imageUrl: string | null) {
  if (cache.size >= MAX_ITEMS) {
    // Remove oldest (Map insertion order) – naive LRU eviction
    const first = cache.keys().next();
    if (!first.done) cache.delete(first.value);
  }
  cache.set(url, { imageUrl, expires: Date.now() + CACHE_TTL });
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!/text\/html/i.test(contentType)) return null;
    const html = await response.text();
    const $ = cheerio.load(html);
    const candidates: string[] = [];
    const og = $('meta[property="og:image"], meta[name="og:image"]').attr('content');
    if (og) candidates.push(og);
    const twitter = $('meta[name="twitter:image"], meta[property="twitter:image"]').attr('content');
    if (twitter) candidates.push(twitter);
    const firstImg = $('img[src]').first().attr('src');
    if (firstImg) candidates.push(firstImg);
    const chosen = candidates.find(Boolean);
    if (!chosen) return null;
    return new URL(chosen, url).toString();
  } catch (err) {
    // Timeout or network error: treat as null so we cache the miss briefly
    console.error(`Error fetching OG image for ${url}:`, err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return new NextResponse('URL parameter is required', { status: 400 });
  try { new URL(url); } catch { return new NextResponse('Invalid URL provided', { status: 400 }); }

  // Check cache (undefined -> not in cache; null -> cached miss)
  const cached = getCached(url);
  if (cached !== undefined) {
    return NextResponse.json({ imageUrl: cached, cached: true });
  }

  const imageUrl = await fetchOgImage(url);
  setCached(url, imageUrl);
  return NextResponse.json({ imageUrl, cached: false });
}
