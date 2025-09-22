// components/providers.tsx
"use client";

import { ApiKeyModal } from "@/components/api-key-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  // This component is a client-side boundary.
  // We can safely place other client-side providers here in the future
  // (like theme providers, toast notifications, etc.)
  return (
    <>
      {children}
      <ApiKeyModal />
    </>
  );
}