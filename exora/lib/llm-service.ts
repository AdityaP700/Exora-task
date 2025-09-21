import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export type LlmProvider = 'openai' | 'gemini' | 'groq';

/**
 * Utility function to extract JSON from LLM response that might be wrapped in markdown
 */
function extractJsonFromResponse(text: string): string {
  // Remove markdown code blocks if present
  const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
  
  // Try to find JSON array or object
  const jsonMatch = cleanText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  
  return cleanText;
}

/**
 * Core LLM text generation
 */
export async function generateText(
  prompt: string,
  provider: LlmProvider,
  apiKey?: string,
  model?: string
): Promise<string> {
  if (!apiKey) {
    throw new Error(`${provider} API key is required`);
  }

  try {
    switch (provider) {
      case 'groq':
        const groq = new Groq({ apiKey });
        const groqResponse = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: model || 'llama-3.1-8b-instant',
          temperature: 0.1, // Lower temperature for more consistent JSON output
        });
        const groqResult = groqResponse.choices[0]?.message?.content || '';
        return extractJsonFromResponse(groqResult);

      case 'openai':
        const openai = new OpenAI({ apiKey });
        const openaiResponse = await openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: model || 'gpt-4o-mini',
          temperature: 0.1, // Lower temperature for more consistent JSON output
        });
        const openaiResult = openaiResponse.choices[0]?.message?.content || '';
        return extractJsonFromResponse(openaiResult);

      case 'gemini':
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ 
          model: model || 'gemini-2.0-flash-exp',
          generationConfig: {
            temperature: 0.1, // Lower temperature for more consistent JSON output
          }
        });
        const result = await geminiModel.generateContent(prompt);
        const geminiResult = result.response.text();
        return extractJsonFromResponse(geminiResult);

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  } catch (error: any) {
    console.error(`Error with ${provider}:`, error);
    
    // Check for specific error types
    if (error.status === 429 || error.code === 'insufficient_quota') {
      throw new Error(`${provider} quota exceeded or rate limited`);
    }
    
    if (error.message?.includes('API key')) {
      throw new Error(`${provider} API key is invalid or missing`);
    }
    
    throw new Error(`Failed to generate text with ${provider}: ${error.message}`);
  }
}

/**
 * Enhanced wrapper with proper fallback chain: Primary -> Gemini -> OpenAI
 */
export async function safeGenerateText(
  prompt: string,
  primaryProvider: LlmProvider,
  primaryKey?: string,
  fallbackProvider?: LlmProvider,
  fallbackKey?: string,
  model?: string
): Promise<string> {
  const providers = [
    { provider: primaryProvider, key: primaryKey },
    { provider: 'gemini' as LlmProvider, key: fallbackKey },
    { provider: 'openai' as LlmProvider, key: primaryKey }
  ].filter(p => p.key); // Only include providers with valid keys

  let lastError: Error | null = null;

  for (let i = 0; i < providers.length; i++) {
    const { provider, key } = providers[i];
    
    try {
      console.log(`Attempting ${provider} (attempt ${i + 1}/${providers.length})`);
      const result = await generateText(prompt, provider, key, model);
      
      if (result && result.trim()) {
        console.log(`✓ ${provider} succeeded`);
        return result;
      }
      
      throw new Error('Empty response received');
      
    } catch (error: any) {
      console.warn(`✗ ${provider} failed:`, error.message);
      lastError = error;
      
      if (i < providers.length - 1) {
        console.log(`Falling back to next provider...`);
      }
    }
  }

  // If all providers failed, throw the last error
  throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
}

/**
 * Specialized function for JSON responses with validation
 */
export async function safeGenerateJson<T = any>(
  prompt: string,
  primaryProvider: LlmProvider,
  primaryKey?: string,
  fallbackProvider?: LlmProvider,
  fallbackKey?: string,
  model?: string
): Promise<T> {
  // Enhance prompt to ensure JSON output
  const enhancedPrompt = `${prompt}

IMPORTANT: Return ONLY valid JSON without any markdown formatting, explanations, or code blocks. The response should start with [ or { and end with ] or }.`;

  const response = await safeGenerateText(
    enhancedPrompt,
    primaryProvider,
    primaryKey,
    fallbackProvider,
    fallbackKey,
    model
  );

  try {
    return JSON.parse(response) as T;
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Raw response:', response);
    throw new Error(`Failed to parse JSON response: ${parseError}`);
  }
}