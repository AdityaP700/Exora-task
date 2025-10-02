// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProviderId = 'exa' | 'groq' | 'gemini' | 'openai';

export interface ProviderValidationState {
  status: 'unknown' | 'validating' | 'valid' | 'invalid';
  lastChecked?: number; // epoch ms
  message?: string; // optional short message / error code
}

interface ApiKeyState {
  // API Keys
  exaApiKey: string;
  groqApiKey: string;
  geminiApiKey: string;
  openAiApiKey: string;

  // Validation metadata per provider
  validation: Record<ProviderId, ProviderValidationState>;

  // UI state
  isModalOpen: boolean;

  // Actions
  setKeys: (keys: Partial<Pick<ApiKeyState, 'exaApiKey' | 'groqApiKey' | 'geminiApiKey' | 'openAiApiKey'>>) => void;
  setValidation: (provider: ProviderId, patch: Partial<ProviderValidationState>) => void;
  resetValidation: (provider?: ProviderId) => void;
  clearKeys: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const initialValidationState: Record<ProviderId, ProviderValidationState> = {
  exa: { status: 'unknown' },
  groq: { status: 'unknown' },
  gemini: { status: 'unknown' },
  openai: { status: 'unknown' },
};

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      // Keys
      exaApiKey: '',
      groqApiKey: '',
      geminiApiKey: '',
      openAiApiKey: '',

      // Validation
      validation: initialValidationState,

      // UI
      isModalOpen: false,

      // Actions
      setKeys: (keys) => set((state) => ({ ...state, ...keys })),
      setValidation: (provider, patch) => set((state) => ({
        validation: {
          ...state.validation,
            [provider]: {
              ...state.validation[provider],
              ...patch,
              lastChecked: patch.status && patch.status !== 'validating' ? Date.now() : state.validation[provider].lastChecked
            }
        }
      })),
      resetValidation: (provider) => set((state) => {
        if (provider) {
          return {
            validation: {
              ...state.validation,
              [provider]: { status: 'unknown' }
            }
          };
        }
        return { validation: { ...initialValidationState } };
      }),
      clearKeys: () => set(() => ({
        exaApiKey: '',
        groqApiKey: '',
        geminiApiKey: '',
        openAiApiKey: '',
        validation: { ...initialValidationState }
      })),
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
    }),
    {
      name: 'exora-api-keys', // Name for localStorage persistence
      version: 2,
      migrate: (persisted: any) => {
        // Backwards compatibility: ensure validation state exists
        if (!persisted.validation) {
          persisted.validation = { ...initialValidationState };
        }
        return persisted;
      }
    }
  )
);