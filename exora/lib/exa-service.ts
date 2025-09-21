// lib/exa-service.ts

const EXA_API_URL = 'https://api.exa.ai/search';

// A generic helper function to make POST requests to the Exa API
async function exaSearch(apiKey: string, requestBody: object): Promise<any> {
  try {
    const response = await fetch(EXA_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // Exa uses 'x-api-key' header
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Log the error response body for better debugging
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

// Helper to get date strings for the past N days
const getPastDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

/**
 * Fetches general news and social mentions for a given domain from the last 14 days.
 */
export async function fetchMentions(domain: string, apiKey: string) {
  const body = {
    query: `"${domain}"`,
    type: 'neural',
    numResults: 20,
    startPublishedDate: getPastDate(14),
  };
  return exaSearch(apiKey, body);
}

/**
 * Fetches high-value business signals (funding, layoffs, etc.) from high-quality
 * news sources from the last 90 days.
 */
export async function fetchSignals(domain: string, apiKey: string) {
  const body = {
    query: `"${domain}" AND (funding OR "series a" OR "series b" OR investment OR acquisition OR layoffs OR "product launch" OR partnership)`,
    type: 'neural',
    numResults: 10,
    startPublishedDate: getPastDate(90),
    includeDomains: ['techcrunch.com', 'wsj.com', 'bloomberg.com', 'forbes.com', 'businessinsider.com'],
  };
  return exaSearch(apiKey, body);
}