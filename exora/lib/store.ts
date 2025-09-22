// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiKeyState {
  exaApiKey: string;
  groqApiKey: string;
  geminiApiKey: string;
  openAiApiKey: string;
  isModalOpen: boolean;
  setKeys: (keys: Partial<ApiKeyState>) => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set) => ({
      exaApiKey: '',
      groqApiKey: '',
      geminiApiKey: '',
      openAiApiKey: '',
      isModalOpen: false,
      setKeys: (keys) => set((state) => ({ ...state, ...keys })),
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
    }),
    {
      name: 'exora-api-keys', // Name for localStorage persistence
    }
  )
);