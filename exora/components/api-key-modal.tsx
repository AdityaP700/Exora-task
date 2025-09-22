// components/api-key-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/button";
import { useApiKeyStore } from "@/lib/store";
import { useState, useEffect } from "react";
import Link from 'next/link';

export function ApiKeyModal() {
  const { isModalOpen, closeModal, setKeys, ...apiKeys } = useApiKeyStore();
  const [localKeys, setLocalKeys] = useState(apiKeys);

  useEffect(() => {
    setLocalKeys(apiKeys);
  }, [isModalOpen, apiKeys]);

  const handleSave = () => {
    setKeys(localKeys);
    closeModal();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[525px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add Your API Keys to Start</DialogTitle>
          <DialogDescription>
            Your keys are stored in your browser and never leave your device. Exa is required.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exa-key">Exa API Key <span className="text-red-500">*</span></Label>
            <Input id="exa-key" value={localKeys.exaApiKey} onChange={(e) => setLocalKeys({...localKeys, exaApiKey: e.target.value})} placeholder="Required for all searches" />
            <Link href="https://dashboard.exa.ai/login" target="_blank" className="text-xs text-blue-500 hover:underline">
              Get your Exa API key
            </Link>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google Gemini API Key</Label>
            <Input id="gemini-key" value={localKeys.geminiApiKey} onChange={(e) => setLocalKeys({...localKeys, geminiApiKey: e.target.value})} placeholder="Optional, for AI analysis" />
            <Link href="https://aistudio.google.com/app/apikey" target="_blank" className="text-xs text-blue-500 hover:underline">
              Get your Gemini API key
            </Link>
          </div>
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input id="openai-key" value={localKeys.openAiApiKey} onChange={(e) => setLocalKeys({...localKeys, openAiApiKey: e.target.value})} placeholder="Optional, fallback for analysis" />
            <Link href="https://platform.openai.com/api-keys" target="_blank" className="text-xs text-blue-500 hover:underline">
              Get your OpenAI API key
            </Link>
          </div>
          <div className="space-y-2">
            <Label htmlFor="groq-key">Groq API Key</Label>
            <Input id="groq-key" value={localKeys.groqApiKey} onChange={(e) => setLocalKeys({...localKeys, groqApiKey: e.target.value})} placeholder="Optional, for fast TL;DRs" />
            <Link href="https://console.groq.com/keys" target="_blank" className="text-xs text-blue-500 hover:underline">
              Get your Groq API key
            </Link>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Keys</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}