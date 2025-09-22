// components/api-key-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApiKeyStore } from "@/lib/store";
import { useState, useEffect } from "react";

export function ApiKeyModal() {
  const { 
    isModalOpen, closeModal, setKeys, 
    exaApiKey, groqApiKey, geminiApiKey, openAiApiKey 
  } = useApiKeyStore();

  const [keys, setLocalKeys] = useState({ exaApiKey, groqApiKey, geminiApiKey, openAiApiKey });

  useEffect(() => {
    setLocalKeys({ exaApiKey, groqApiKey, geminiApiKey, openAiApiKey });
  }, [isModalOpen, exaApiKey, groqApiKey, geminiApiKey, openAiApiKey]);

  const handleSave = () => {
    setKeys(keys);
    closeModal();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[525px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add Your API Keys To Start</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exa-key" className="text-right">Exa API Key</Label>
            <Input id="exa-key" value={keys.exaApiKey} onChange={(e) => setLocalKeys({...keys, exaApiKey: e.target.value})} className="col-span-3" placeholder="(Required)" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="groq-key" className="text-right">Groq API Key</Label>
            <Input id="groq-key" value={keys.groqApiKey} onChange={(e) => setLocalKeys({...keys, groqApiKey: e.target.value})} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gemini-key" className="text-right">Gemini API Key</Label>
            <Input id="gemini-key" value={keys.geminiApiKey} onChange={(e) => setLocalKeys({...keys, geminiApiKey: e.target.value})} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="openai-key" className="text-right">OpenAI API Key</Label>
            <Input id="openai-key" value={keys.openAiApiKey} onChange={(e) => setLocalKeys({...keys, openAiApiKey: e.target.value})} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save API Keys</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}