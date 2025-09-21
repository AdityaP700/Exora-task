// lib/llm-service.ts

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export type LlmProvider = 'openai' | 'gemini' | 'groq';

export async function generateText(
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
          model: model || 'llama3-8b-8192', // Fast model for TL;DR
        });
        return groqResponse.choices[0]?.message?.content || '';

      case 'openai':
        const openai = new OpenAI({ apiKey });
        const openaiResponse = await openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: model || 'gpt-4o-mini',
        });
        return openaiResponse.choices[0]?.message?.content || '';

      case 'gemini':
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash-latest' });
        const result = await geminiModel.generateContent(prompt);
        return result.response.text();

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error with ${provider}:`, error);
    throw new Error(`Failed to generate text with ${provider}.`);
  }
}