// lib/exa-service.ts
const EXA_API_URL = 'https://api.exa.ai/search';

// 🔧 FIXED: Add delay function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function exaSearch(apiKey: string, requestBody: object): Promise<any> {
  try {
    const response = await fetch(EXA_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Exa API Error:', errorBody);
      throw new Error(`Exa API request failed with status ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch from Exa API:', error);
    throw error;
  }
}

const getPastDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// 🔧 FIXED: Rate-limited mentions fetching
export async function fetchMentions(domain: string, apiKey: string): Promise<any> {
  const companyName = domain.split('.')[0];
  console.log(`🔍 Fetching mentions for: ${domain}`);
  
  const body = {
    query: `"${domain}" OR "${companyName}"`,
    type: 'neural',
    numResults: 25,
    startPublishedDate: getPastDate(14),
  };
  
  try {
    const result = await exaSearch(apiKey, body);
    console.log(`📊 Mentions found for ${domain}: ${result.results?.length || 0}`);
    return result;
  } catch (error) {
    console.warn(`Failed to fetch mentions for ${domain}:`, error);
    return { results: [] };
  }
}

// 🔧 FIXED: Sequential signals fetching with delays
export async function fetchSignals(domain: string, apiKey: string): Promise<any> {
  const companyName = domain.split('.')[0];
  console.log(`🎯 Fetching signals for: ${domain}`);
  
  const queries = [
    `"${companyName}" funding OR "${companyName}" raises OR "${companyName}" investment`,
    `"${companyName}" launches OR "${companyName}" announces OR "${companyName}" releases`, 
    `"${companyName}" acquires OR "${companyName}" acquisition OR "${companyName}" merger`,
    `"${companyName}" layoffs OR "${companyName}" cuts OR "${companyName}" restructuring`
  ];

  const allResults: any[] = [];
  
  // 🔧 FIXED: Sequential processing instead of parallel to avoid rate limits
  for (let i = 0; i < queries.length; i++) {
    try {
      const result = await exaSearch(apiKey, {
        query: queries[i],
        type: 'neural',
        numResults: 5, // Reduced to stay under limits
        startPublishedDate: getPastDate(90),
        includeDomains: ['techcrunch.com', 'wsj.com', 'bloomberg.com', 'forbes.com', 'businessinsider.com', 'reuters.com']
      });
      
      if (result.results) {
        allResults.push(...result.results);
        console.log(`📈 Query ${i + 1} for ${domain}: ${result.results.length} results`);
      }
      
      // 🔧 FIXED: Add delay between requests (5 requests per second = 200ms between requests)
      if (i < queries.length - 1) {
        await delay(250); // 250ms delay = ~4 requests per second (safely under 5/sec limit)
      }
      
    } catch (error) {
      console.warn(`Signal query ${i + 1} failed for ${domain}:`, error);
      continue; // Continue with next query instead of failing completely
    }
  }
  
  // Remove duplicates and sort
  const uniqueResults = allResults
    .filter((result, index, self) => 
      result.url && index === self.findIndex(r => r.url === result.url)
    )
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
  
  console.log(`🎯 Total signals for ${domain}: ${allResults.length} raw → ${uniqueResults.length} unique`);
  return { results: uniqueResults.slice(0, 15) };
}
export async function fetchHistoricalData(domain: string, apiKey: string): Promise<any[]> {
  const companyName = domain.split('.')[0];
  const datePoints: { date: string; mentions: number }[] = [];
  
  // Create an array of the last 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  // Fetch mention counts for each day sequentially to respect rate limits
  for (const date of dates.reverse()) { // Start from oldest to newest
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const body = {
      query: `"${domain}" OR "${companyName}"`,
      numResults: 100, // We only care about the count, so get as many as possible
      startPublishedDate: date,
      endPublishedDate: nextDay.toISOString().split('T')[0],
    };
    
    try {
      // Use Exa's /search endpoint which is efficient for counts
      const result = await exaSearch(apiKey, body);
      datePoints.push({ date, mentions: result.results?.length || 0 });
      await new Promise(resolve => setTimeout(resolve, 250)); // Stay safely under rate limit
    } catch (error) {
      console.warn(`Could not fetch historical data for ${domain} on ${date}:`, error);
      datePoints.push({ date, mentions: 0 });
    }
  }
  return datePoints;
}