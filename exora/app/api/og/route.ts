import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'edge';

async function fetchAndParse(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000), // 5-second timeout
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const ogImage = $('meta[property="og:image"]').attr('content');

    if (ogImage) {
      // Make sure the URL is absolute
      return new URL(ogImage, url).toString();
    }

    return null;
  } catch (error) {
    console.error(`Error fetching OG image for ${url}:`, error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  try {
    new URL(url);
  } catch (e) {
    return new NextResponse('Invalid URL provided', { status: 400 });
  }

  const imageUrl = await fetchAndParse(url);

  if (imageUrl) {
    return NextResponse.json({ imageUrl });
  }

  // Fallback or empty response
  return NextResponse.json({ imageUrl: null }, { status: 404 });
}
