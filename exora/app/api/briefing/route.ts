// app/api/briefing/route.ts

import { NextResponse } from 'next/server';
import { safeGenerateText, safeGenerateJson, ProviderConfig } from '@/lib/llm-service';
import { fetchExaData, fetchHistoricalData } from '@/lib/exa-service';
import { calculateNarrativeMomentum, calculatePulseIndex, generateSentimentHistoricalData, generateEnhancedSentimentAnalysis } from '@/lib/analysis-service';
import { normalizePublishedDate } from '@/lib/utils';
import { BriefingResponse, EventType, CompanyProfile, FounderInfo } from '@/lib/types';

// --- HELPER FUNCTIONS ---

function getIndustryDefaults(domain: string): string[] {
  if (domain.includes('ai') || domain.includes('tech')) return ['openai.com', 'anthropic.com', 'google.com'];
  if (domain.includes('shop') || domain.includes('store')) return ['shopify.com', 'amazon.com', 'ebay.com'];
  if (domain.includes('pay') || domain.includes('bank')) return ['paypal.com', 'stripe.com', 'square.com'];
  return ['google.com', 'microsoft.com', 'amazon.com'];
}

function parseCompetitorResponse(text: string): string[] {
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch { }
  }
  const domainMatches = text.match(/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  return domainMatches ? domainMatches.slice(0, 3) : [];
}

async function discoverCompetitors(domain: string, providers: ProviderConfig[]): Promise<string[]> {
  const prompt = `Analyze ONLY the company operating at the exact domain \"${domain}\" (ignore similarly named companies on different TLDs like .finance, .ai, etc.). Identify the top 3 direct competitors. Return ONLY a JSON array of competitor domains.\n\nExamples:\n- stripe.com → ["paypal.com", "square.com", "adyen.com"]\n\nFormat: ["competitor1.com", "competitor2.com", "competitor3.com"]`;

  try {
    const result = await safeGenerateJson<string[]>(prompt, providers);
    if (result && Array.isArray(result) && result.length > 0) {
      console.log('✅ Competitor discovery via JSON succeeded.');
      return result;
    }
  } catch (error) {
    console.warn(`Competitor discovery via JSON failed, falling back to text parsing...`);
  }

  try {
    const textResult = await safeGenerateText(prompt, providers);
    const parsedCompetitors = parseCompetitorResponse(textResult);
    if (parsedCompetitors.length > 0) {
      console.log('✅ Competitor discovery via text parsing succeeded.');
      return parsedCompetitors;
    }
  } catch (error) {
    console.warn(`Competitor discovery via text parsing failed, falling back to industry defaults...`);
  }

  console.log('⚠️ Using industry default competitors.');
  return getIndustryDefaults(domain);
}

function validateAndCleanCompetitors(competitors: string[], primaryDomain: string): string[] {
  return competitors
    .map(d => d.replace(/https?:\/\//, '').replace(/^www\./, '').replace(/["']/g, '').trim())
    .filter(d => d && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(d) && d.toLowerCase() !== primaryDomain.toLowerCase())
    .slice(0, 3);
}

async function getSentimentScore(headlines: string[], groqKey?: string, openAiKey?: string): Promise<number> {
  if (headlines.length === 0) return 50;
  const prompt = `Analyze the sentiment of these headlines about a company. You MUST respond with ONLY a number between 0-100. No words, no explanation.\n\n0 = Very Negative\n50 = Neutral\n100 = Very Positive\n\nHeadlines:\n${headlines.map((h) => `- ${h}`).join('\n')}\n\nResponse (number only):`;

  try {
    const scoreText = await safeGenerateText(prompt, [
      { provider: 'groq', apiKey: groqKey },
      { provider: 'openai', apiKey: openAiKey }
    ]);
    const cleanText = scoreText.trim().replace(/[^0-9.]/g, '');
    let score = parseInt(cleanText);
    if (isNaN(score)) { score = Math.round(parseFloat(cleanText)); }
    if (isNaN(score)) {
      const matches = scoreText.match(/\d+/);
      if (matches) { score = parseInt(matches[0]); }
    }
    if (isNaN(score) || score < 0 || score > 100) { return 50; }
    return score;
  } catch (e) { return 50; }
}

function isRelevantToCompany(headline: string, domain: string): boolean {
  const companyName = domain.split('.')[0].toLowerCase();
  const headlineLower = headline.toLowerCase();
  const relevancePatterns = [
    new RegExp(`^${companyName}`, 'i'),
    new RegExp(`${companyName} (announces|launches|raises|acquires|cuts|hires|reports)`, 'i'),
  ];
  return relevancePatterns.some(pattern => pattern.test(headlineLower));
}

async function classifyEventType(title: string, groqKey?: string, openAiKey?: string): Promise<EventType | "Other"> {
  if (!title) return "Other";
  const prompt = `Classify this headline into ONE category: Funding, Product Launch, Acquisition, Layoffs. Return ONLY the category name, no other text.\n\nHeadline: "${title}"`;

  try {
    const classification = await safeGenerateText(prompt, [
      { provider: 'groq', apiKey: groqKey },
      { provider: 'openai', apiKey: openAiKey }
    ]);
    const clean = classification.trim().split('\n')[0].replace(/[^a-zA-Z\s]/g, '').trim();
    if (["Funding", "Product Launch", "Acquisition", "Layoffs"].includes(clean)) {
      return clean as EventType;
    }
    return "Other";
  } catch (e) { return "Other"; }
}

// Optional NewsAPI fallback when Exa is unavailable or returns empty
async function fetchNewsApiFallback(domain: string, apiKey?: string) {
  if (!apiKey) return [] as { title: string; url: string; publishedAt: string; source?: { name?: string } }[]
  const companyName = domain.split('.')[0]
  const params = new URLSearchParams({
    q: `${companyName} OR ${domain}`,
    sortBy: 'publishedAt',
    language: 'en',
    pageSize: '12'
  })
  const url = `https://newsapi.org/v2/everything?${params.toString()}`
  try {
    const res = await fetch(url, { headers: { 'X-Api-Key': apiKey } })
    if (!res.ok) return []
    const json = await res.json()
    const articles = (json.articles || []) as any[]
    // Filter homonyms: keep exact-domain links and trusted news; drop other brand TLDs
    const trustedNews = new Set([
      'techcrunch.com', 'wsj.com', 'bloomberg.com', 'forbes.com', 'businessinsider.com', 'reuters.com', 'theverge.com', 'nytimes.com', 'ft.com', 'wired.com', 'cnbc.com', 'cnn.com', 'bbc.com'
    ])
    const getHost = (u: string): string | null => { try { return new URL(u).hostname.toLowerCase() } catch { return null } }
    const target = domain.toLowerCase()
    const brand = companyName.toLowerCase()
    return articles.filter(a => {
      const host = getHost(a.url)
      if (!host) return true
      const isExact = host === target || host.endsWith(`.${target}`)
      if (isExact) return true
      const isTrusted = trustedNews.has(host) || Array.from(trustedNews).some(n => host === n || host.endsWith(`.${n}`))
      if (isTrusted) return true
      if (host.includes(brand)) return false
      return true
    })
  } catch {
    return []
  }
}

// Layer 2: AI "Bouncer" — quick, cheap validation to avoid nonsense inputs
async function validateDomainIsCompany(domain: string, providers: ProviderConfig[]): Promise<boolean> {
  const prompt = `Is the website at the domain "${domain}" the primary, official website for a single company, organization, or commercial product? Answer ONLY with a single word: YES or NO.`
  try {
    const response = await safeGenerateText(prompt, providers)
    if (/YES/i.test(response)) {
      console.log(`✅ Domain validation PASSED for: ${domain}`)
      return true
    }
  } catch (error) {
    console.warn(`Domain validation LLM call failed for ${domain}:`, error)
    // Graceful: if the validator fails, allow downstream best-effort
    return true
  }
  console.log(`❌ Domain validation FAILED for: ${domain}`)
  return false
}

// --- MAIN API ENDPOINT ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawDomain = searchParams.get('domain');

  // 🔧 FIXED: Get API keys ONLY from the server's .env.local file.
  const exaApiKey = process.env.EXA_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const newsApiKey = process.env.NEWS_API_KEY;

  if (!rawDomain) {
    return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 });
  }
  // 🔧 FIXED: Check for server-side keys now.
  if (!exaApiKey) {
    return NextResponse.json({ error: 'Missing EXA_API_KEY in the server environment (.env.local)' }, { status: 500 });
  }

  const domain = rawDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').trim();
  console.log(`🏢 Processing domain: "${rawDomain}" → cleaned: "${domain}"`);

  try {
    const llmProviders: ProviderConfig[] = [
      { provider: 'gemini', apiKey: geminiApiKey },
      { provider: 'openai', apiKey: openAiApiKey }
    ];
    const groqProviders: ProviderConfig[] = [
      { provider: 'groq', apiKey: groqApiKey },
      { provider: 'gemini', apiKey: geminiApiKey }
    ];

    // --- NEW: Layer 2 - The AI Bouncer ---
    const isCompany = await validateDomainIsCompany(domain, groqProviders)
    if (!isCompany) {
      return NextResponse.json({
        error: 'Invalid Input',
        details: `The provided URL "${domain}" does not appear to be a primary company website. Please try a different domain.`
      }, { status: 400 })
    }


    // --- Step 1: Improved Groq TL;DR ---
    const groqTlDrPrompt = `What is the company at the domain "${domain}"? Provide a brief, factual description of what they do in one sentence. If you're not familiar with this specific company, make a reasonable inference based on the domain name and provide a general business description.`;
    const groqTlDrPromise = safeGenerateText(groqTlDrPrompt, groqProviders)
      .catch(() => `Company analysis for ${domain}`);

    const competitorsPromise = discoverCompetitors(domain, llmProviders)
      .then(raw => validateAndCleanCompetitors(raw, domain));

    const [groqTlDr, competitors] = await Promise.all([groqTlDrPromise, competitorsPromise]);
    const allDomains = [domain, ...competitors];

    // --- Step 2: Additional LLM metadata (Company Profile, Founders) ---
    const profilePrompt = `Provide a concise profile for the company at "${domain}".
Return ONLY a valid JSON object with keys: name, description, ipoStatus ("Public"|"Private"|"Unknown"), socials (object with linkedin, twitter, facebook URLs).`;
    const foundersPrompt = `Who are the key founders of the company at "${domain}"? Return ONLY a valid JSON array of objects, each with fields: name, linkedin, twitter.`;

    const companyProfilePromise = safeGenerateJson<CompanyProfile>(profilePrompt, llmProviders)
      .catch(() => ({ name: domain.split('.')[0], domain, description: `Company at ${domain}`, ipoStatus: 'Unknown', socials: {} } as CompanyProfile));
    const founderInfoPromise = safeGenerateJson<FounderInfo[]>(foundersPrompt, llmProviders)
      .catch(() => []);

    // --- Step 3: Combined Data Fetch with Historical Data ---
    console.log(`📋 Fetching comprehensive data for domains: ${allDomains.join(', ')}`);

    const [mentionsResults, signalsResults, historicalDataResults, profileResult, foundersResult] = await Promise.allSettled([
      Promise.all(
        allDomains.map((d, i) => new Promise(resolve => setTimeout(resolve, i * 250)).then(() => {
          const limit = i === 0 ? 15 : 8; // main company richer, competitors lighter
          return fetchExaData(d, 'mentions', exaApiKey, { numResults: limit })
        }))
      ),
      fetchExaData(domain, 'signals', exaApiKey),
      Promise.all(allDomains.map(d => fetchHistoricalData(d, exaApiKey))), // This is slow, but necessary for V1
      companyProfilePromise,
      founderInfoPromise
    ]);

    const allMentions = (mentionsResults.status === 'fulfilled') ? mentionsResults.value : allDomains.map(() => ({ results: [] }));
    const primarySignals = (signalsResults.status === 'fulfilled') ? signalsResults.value : { results: [] };
    const allHistoricalData = (historicalDataResults.status === 'fulfilled') ? historicalDataResults.value : allDomains.map(() => []);
    const companyProfile = (profileResult.status === 'fulfilled') ? profileResult.value as CompanyProfile : { name: domain.split('.')[0], domain, description: `Company at ${domain}`, ipoStatus: 'Unknown', socials: {} } as CompanyProfile;
    const founderInfo = (foundersResult.status === 'fulfilled') ? foundersResult.value as FounderInfo[] : [];

    // If Exa mentions are empty, try NewsAPI fallback per domain
    const enhancedMentions = await Promise.all(allDomains.map(async (d, i) => {
      const cur = allMentions[i]?.results || []
      if (cur.length > 0) return { results: cur }
      if (!newsApiKey) return { results: [] }
      const articles = await fetchNewsApiFallback(d, newsApiKey)
      const mapped = articles.map((a: any) => ({
        title: a.title,
        url: a.url,
        domain: a.source?.name || 'news',
        publishedDate: normalizePublishedDate(a.publishedAt)
      }))
      return { results: mapped }
    }))

    console.log(`📋 Final data summary: mentions=${enhancedMentions.map((m, i) => `${allDomains[i]}:${m.results?.length || 0}`).join(', ')}, historical=${allHistoricalData.map((h, i) => `${allDomains[i]}:${h?.length || 0}`).join(', ')}`);

    // --- Step 4a: Real Sentiment Analysis ---
    const sentimentScores = await Promise.all(
      enhancedMentions.map(mention => {
        const headlines = (mention.results || []).slice(0, 5).map((m: any) => m.title || '');
        return getSentimentScore(headlines, groqApiKey ?? undefined, openAiApiKey ?? undefined);
      })
    );

    // --- Step 4b: Event Log Processing with fallback ---
    const allRawSignals = (primarySignals.results || []);
    // Start with strict relevance; if we got too few, relax the filter
    let relevantSignals = allRawSignals.filter((s: any) => s.title && isRelevantToCompany(s.title, domain));
    if (relevantSignals.length < 3) {
      relevantSignals = allRawSignals.filter((s: any) => !!s.title);
    }

    let finalEventLog;
    if (relevantSignals.length > 0) {
      const classifiedEvents = await Promise.all(
        relevantSignals.slice(0, 12).map(async (signal: any) => ({
          date: normalizePublishedDate(signal.publishedDate || new Date().toISOString()),
          headline: signal.title || 'N/A',
          type: await classifyEventType(signal.title, groqApiKey ?? undefined, openAiApiKey ?? undefined),
          url: signal.url || ''
        }))
      );
      finalEventLog = classifiedEvents;
    } else {
      // Fallback: build news from primary mentions, prefer exact-domain matches first
      const primaryMentions = (enhancedMentions[0]?.results || []) as any[];
      const target = domain.toLowerCase();
      const getHost = (u: string): string | null => { try { return new URL(u).hostname.toLowerCase() } catch { return null } }
      const exact = primaryMentions.filter(m => { const h = getHost(m.url); return h && (h === target || h.endsWith(`.${target}`)) })
      const rest = primaryMentions.filter(m => !exact.includes(m))
      const ordered = [...exact, ...rest]
      finalEventLog = ordered.slice(0, 12).map((m: any) => ({
        date: normalizePublishedDate(m.publishedDate || new Date().toISOString()),
        headline: m.title || 'N/A',
        type: 'Other' as const,
        url: m.url || '#'
      }));
    }

    // --- Step 4c: Calculate Final Benchmark Matrix (WITH SENTIMENT DATA) ---
    const enableEnhanced = process.env.ENABLE_ENHANCED_SENTIMENT === 'true'

    const benchmarkMatrix = allDomains.map((d, i) => {
      const mentions = enhancedMentions[i]?.results || [];
      const narrativeMomentum = calculateNarrativeMomentum(mentions);
      const sentimentScore = sentimentScores[i];
      const pulseIndex = calculatePulseIndex(narrativeMomentum, sentimentScore);
      const sentimentHistoricalData = generateSentimentHistoricalData(mentions, sentimentScore);
      const eventsForDomain = i === 0 ? finalEventLog : [] // only primary has classified events right now
      const enhancedSentiment = enableEnhanced ? generateEnhancedSentimentAnalysis(
        mentions,
        eventsForDomain,
        sentimentScore,
        narrativeMomentum,
        { peerVolumes: enhancedMentions.map(m => m.results?.length || 0) }
      ) : undefined

      let topNews: any[];
      if (i === 0) {
        // Main company: Get 5 latest news
        topNews = (mentions || [])
          .slice(0, 5)
          .map((m: any) => ({
            headline: m.title || 'N/A',
            url: m.url || '#',
            source: m.domain || 'unknown',
            publishedDate: normalizePublishedDate(m.publishedDate || new Date().toISOString()),
          }));
      } else {
        // Competitors: store all, filter later to a global cap
        topNews = (mentions || []).map((m: any) => ({
          headline: m.title || 'N/A',
          url: m.url || '#',
          source: m.domain || 'unknown',
          publishedDate: normalizePublishedDate(m.publishedDate || new Date().toISOString()),
          domain: d,
        }));
      }

      return {
        domain: d,
        pulseIndex,
        narrativeMomentum,
        sentimentScore,
        historicalData: allHistoricalData[i] || [],
        sentimentHistoricalData,
        news: topNews,
        enhancedSentiment,
      };
    });

    // Refine competitor news: keep 2–4 credible/trending items per competitor
    const trustedSources = new Set([
      'techcrunch.com', 'wsj.com', 'bloomberg.com', 'forbes.com', 'businessinsider.com', 'reuters.com', 'theverge.com', 'nytimes.com', 'ft.com', 'wired.com', 'cnbc.com', 'cnn.com', 'bbc.com'
    ])

    benchmarkMatrix.forEach((company: any, i) => {
      if (i === 0) return // skip primary here
      const filtered = (company.news || [])
        .filter((n: any) => n.headline && n.headline !== 'N/A')
        .map((n: any) => ({
          ...n,
          credibility: trustedSources.has((n.source || '').toLowerCase()) ? 1 : 0,
          freshness: Date.now() - new Date(n.publishedDate).getTime()
        }))
        .sort((a: any, b: any) => {
          // Primary sort: credibility desc, then recency asc
          if (b.credibility !== a.credibility) return b.credibility - a.credibility
          return a.freshness - b.freshness
        })
        .slice(0, 4)
      // Guarantee minimum 2: if less than 2 after filtering, fallback to earliest remaining originals
      if (filtered.length < 2) {
        const originals = (company.news || []).filter((n: any) => n.headline && n.headline !== 'N/A')
          .sort((a: any, b: any) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
          .slice(0, 2)
        company.news = originals
      } else {
        company.news = filtered.map(({ credibility, freshness, ...rest }: any) => rest)
      }
    })
    // --- Step 5: IMPROVED AI Strategic Synthesis with actual sentiment data ---
    const superPrompt = `EXECUTIVE BRIEF: Strategic Analysis for ${domain}

You are preparing a board-level strategic assessment. The data below represents real-time competitive intelligence with sentiment analysis across key market players.

COMPETITIVE INTELLIGENCE:
Primary Company: ${domain}
- Sentiment Score: ${benchmarkMatrix[0]?.sentimentScore || 0}/100
- Narrative Momentum: ${benchmarkMatrix[0]?.narrativeMomentum || 0}%
- Recent News: ${benchmarkMatrix[0]?.news?.slice(0, 2).map(n => n.headline).join('; ') || 'None'}

Competitors:
${benchmarkMatrix.slice(1).map(comp => `
- ${comp.domain}: Sentiment ${comp.sentimentScore}/100, Momentum ${comp.narrativeMomentum}%`).join('')}

STRATEGIC ANALYSIS DIRECTIVE:
Based on the sentiment scores and momentum data, provide exactly 3 strategic insights:

1. COMPETITIVE POSITIONING: How does ${domain}'s sentiment (${benchmarkMatrix[0]?.sentimentScore}/100) compare to competitors? What does this reveal about market perception?

2. MARKET DYNAMICS: What do the sentiment differentials indicate about industry trends and ${domain}'s brand strength vs competitors?

3. STRATEGIC PRIORITIES: Given the sentiment analysis, what should be the top priority to improve market perception and competitive position?

REQUIREMENTS:
- Reference specific sentiment scores in your analysis
- Focus on actionable strategic implications
- Each point should be executive-level and forward-looking
- Maximum 35 words per bullet point

OUTPUT: 3 bullet points, each starting with "• ";`

    const summaryResponse = await safeGenerateText(
      superPrompt,
      [
        { provider: 'gemini', apiKey: geminiApiKey ?? undefined, model: 'gemini-2.0-flash' },
        { provider: 'openai', apiKey: openAiApiKey ?? undefined, model: 'gpt-4o' }
      ]
    ).catch(() => '');

    const summaryPoints = summaryResponse.split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('•') && l.length > 10)
      .slice(0, 3);

    if (summaryPoints.length === 0) {
      const primarySentiment = benchmarkMatrix[0]?.sentimentScore || 50;
      const avgCompetitorSentiment = benchmarkMatrix.slice(1).reduce((acc, comp) => acc + comp.sentimentScore, 0) / Math.max(benchmarkMatrix.length - 1, 1);

      if (primarySentiment > avgCompetitorSentiment + 10) {
        summaryPoints.push(`• ${domain} shows stronger market sentiment (${primarySentiment}/100) than competitors, indicating positive brand perception and growth potential.`);
        summaryPoints.push(`• Leverage current positive sentiment momentum to expand market share and strengthen competitive positioning against rivals.`);
        summaryPoints.push(`• Focus on maintaining sentiment advantage through consistent product innovation and strategic communications to sustain market leadership.`);
      } else if (primarySentiment < avgCompetitorSentiment - 10) {
        summaryPoints.push(`• ${domain} sentiment (${primarySentiment}/100) lags competitors, indicating potential brand perception challenges requiring immediate strategic attention.`);
        summaryPoints.push(`• Implement comprehensive reputation management strategy to address sentiment gap and rebuild market confidence.`);
        summaryPoints.push(`• Prioritize customer experience improvements and strategic communications to close sentiment deficit with key competitors.`);
      } else {
        summaryPoints.push(`• ${domain} maintains competitive sentiment parity (${primarySentiment}/100), suggesting stable market position with room for strategic differentiation.`);
        summaryPoints.push(`• Balanced competitive landscape creates opportunity for breakthrough initiatives to capture sentiment leadership and market share.`);
        summaryPoints.push(`• Focus on innovation and unique value proposition to break away from competitor sentiment clustering.`);
      }
    }
    // Log the executive summary for debugging
    console.log(`📋 Executive Summary Generated:`);
    summaryPoints.forEach((point, i) => console.log(`   ${i + 1}. ${point}`));

    // --- Step 6: Bundle Response ---
    const response: BriefingResponse = {
      requestDomain: domain,
      companyProfile: { ...companyProfile, domain },
      founderInfo,
      benchmarkMatrix,
      newsFeed: finalEventLog,
      aiSummary: {
        summary: summaryPoints,
        groqTlDr,
      },
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Full briefing generation error:', error);
    return NextResponse.json({ error: 'Failed to generate briefing', details: error.message }, { status: 500 });
  }
}
