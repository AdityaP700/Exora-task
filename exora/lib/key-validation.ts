// lib/key-validation.ts
// Lightweight client-side key validation utilities.
// These intentionally use minimal endpoints to reduce quota usage.

import { useApiKeyStore, ProviderId } from './store';

export interface ValidationResult {
  provider: ProviderId;
  status: 'valid' | 'invalid';
  message?: string;
}

async function validateExa(key: string): Promise<ValidationResult> {
  try {
    if (!key) return { provider: 'exa', status: 'invalid', message: 'Missing key' };
    const resp = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify({ query: 'test', numResults: 1 })
    });
    if (resp.status === 401 || resp.status === 403) return { provider: 'exa', status: 'invalid', message: 'Unauthorized' };
    if (!resp.ok) return { provider: 'exa', status: 'invalid', message: `HTTP ${resp.status}` };
    return { provider: 'exa', status: 'valid' };
  } catch (e: any) {
    return { provider: 'exa', status: 'invalid', message: e?.message || 'Network error' };
  }
}

async function validateOpenAI(key: string): Promise<ValidationResult> {
  try {
    if (!key) return { provider: 'openai', status: 'invalid', message: 'Missing key' };
    const resp = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` }
    });
    if (resp.status === 401 || resp.status === 403) return { provider: 'openai', status: 'invalid', message: 'Unauthorized' };
    if (!resp.ok) return { provider: 'openai', status: 'invalid', message: `HTTP ${resp.status}` };
    return { provider: 'openai', status: 'valid' };
  } catch (e: any) {
    return { provider: 'openai', status: 'invalid', message: e?.message || 'Network error' };
  }
}

async function validateGroq(key: string): Promise<ValidationResult> {
  try {
    if (!key) return { provider: 'groq', status: 'invalid', message: 'Missing key' };
    const resp = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${key}` }
    });
    if (resp.status === 401 || resp.status === 403) return { provider: 'groq', status: 'invalid', message: 'Unauthorized' };
    if (!resp.ok) return { provider: 'groq', status: 'invalid', message: `HTTP ${resp.status}` };
    return { provider: 'groq', status: 'valid' };
  } catch (e: any) {
    return { provider: 'groq', status: 'invalid', message: e?.message || 'Network error' };
  }
}

async function validateGemini(key: string): Promise<ValidationResult> {
  try {
    if (!key) return { provider: 'gemini', status: 'invalid', message: 'Missing key' };
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    if (resp.status === 400 || resp.status === 401 || resp.status === 403) return { provider: 'gemini', status: 'invalid', message: 'Unauthorized' };
    if (!resp.ok) return { provider: 'gemini', status: 'invalid', message: `HTTP ${resp.status}` };
    return { provider: 'gemini', status: 'valid' };
  } catch (e: any) {
    return { provider: 'gemini', status: 'invalid', message: e?.message || 'Network error' };
  }
}

const validators: Record<ProviderId, (key: string) => Promise<ValidationResult>> = {
  exa: validateExa,
  groq: validateGroq,
  gemini: validateGemini,
  openai: validateOpenAI,
};

export async function validateProvider(provider: ProviderId) {
  const store = useApiKeyStore.getState();
  const keyMap: Record<ProviderId, string> = {
    exa: store.exaApiKey,
    groq: store.groqApiKey,
    gemini: store.geminiApiKey,
    openai: store.openAiApiKey,
  };
  const key = keyMap[provider];
  useApiKeyStore.getState().setValidation(provider, { status: 'validating', message: undefined });
  const result = await validators[provider](key);
  useApiKeyStore.getState().setValidation(provider, { status: result.status === 'valid' ? 'valid' : 'invalid', message: result.message });
  return result;
}

export async function validateAllProviders() {
  const providers: ProviderId[] = ['exa', 'groq', 'gemini', 'openai'];
  const results: ValidationResult[] = [];
  for (const p of providers) {
    // Only validate if a key is present (except Exa which is required to confirm presence)
    const state = useApiKeyStore.getState();
    const present = p === 'exa' ? true : !!(
      (p === 'groq' && state.groqApiKey) ||
      (p === 'gemini' && state.geminiApiKey) ||
      (p === 'openai' && state.openAiApiKey)
    );
    if (!present) {
      // Reset validation to unknown if no key
      state.resetValidation(p);
      continue;
    }
    const res = await validateProvider(p);
    results.push(res);
  }
  return results;
}
