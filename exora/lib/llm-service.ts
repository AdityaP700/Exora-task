// lib/llm-service.ts

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export type LlmProvider = 'openai' | 'gemini' | 'groq';

// REFINED: This helper is now only used when JSON is explicitly expected.
function extractJsonFromResponse(text: string): string | null {
  const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  return match ? match[0] : null;
}

// REFINED: The core function now focuses ONLY on generating raw text.
async function generateText(
  prompt: string,
  provider: LlmProvider,
  apiKey: string,
  model?: string
): Promise<string> {
  try {
    switch (provider) {
      case 'groq':
        const groq = new Groq({ apiKey });
        const groqResponse = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          // 🔧 FIXED: Use a supported and fast model
          model: model || 'llama-3.1-8b-instant', 
          temperature: 0.1,
        });
        return groqResponse.choices[0]?.message?.content || '';
      case 'openai':
        const openai = new OpenAI({ apiKey });
        const openaiResponse = await openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: model || 'gpt-4o-mini',
          temperature: 0.1,
        });
        return openaiResponse.choices[0]?.message?.content || '';

      case 'gemini':
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ 
          model: model || 'gemini-2.0-flash', // The best choice for speed/power balance
          generationConfig: { temperature: 0.1 }
        });
        const result = await geminiModel.generateContent(prompt);
        return result.response.text();

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  } catch (error: any) {
    console.error(`Error with ${provider}:`, error);
    throw new Error(`Failed to generate text with ${provider}: ${error.message}`);
  }
}

// NEW: Define a clear structure for provider configuration.
export interface ProviderConfig {
  provider: LlmProvider;
  apiKey?: string;
  model?: string;
}

/**
 * SUPERIOR: The new safeGenerateText accepts an array of provider configs,
 * creating a clear and dynamic fallback chain.
 */
export async function safeGenerateText(prompt: string, providers: ProviderConfig[]): Promise<string> {
  const availableProviders = providers.filter(p => p.apiKey);

  if (availableProviders.length === 0) {
    throw new Error('No LLM providers with valid API keys were provided.');
  }

  let lastError: Error | null = null;

  for (const { provider, apiKey, model } of availableProviders) {
    try {
      const result = await generateText(prompt, provider, apiKey!, model);
      if (result && result.trim()) {
        return result;
      }
      throw new Error('Empty response received');
    } catch (error: any) {
      lastError = error;
      console.warn(`Provider ${provider} failed: ${error.message}. Falling back...`);
    }
  }

  throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
}

/**
 * SUPERIOR: The new safeGenerateJson uses the dynamic fallback chain and
 * handles its own JSON cleaning and parsing.
 */
export async function safeGenerateJson<T = any>(prompt: string, providers: ProviderConfig[]): Promise<T> {
  const enhancedPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON.`;
  const responseText = await safeGenerateText(enhancedPrompt, providers);

  const jsonString = extractJsonFromResponse(responseText);
  if (!jsonString) {
    console.error('Raw response did not contain valid JSON:', responseText);
    throw new Error('Failed to extract JSON from LLM response.');
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Extracted JSON string:', jsonString);
    throw new Error(`Failed to parse JSON: ${parseError}`);
  }
}