// components/api-key-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/button";
import { useApiKeyStore } from "@/lib/store";
import { useState, useEffect } from "react";
import Link from 'next/link';
import { validateProvider, validateAllProviders } from '@/lib/key-validation';
import { Shield, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

export function ApiKeyModal() {
  const { isModalOpen, closeModal, setKeys, validation, setValidation, resetValidation, clearKeys, ...apiKeys } = useApiKeyStore();
  const [localKeys, setLocalKeys] = useState(apiKeys);
  const [bulkValidating, setBulkValidating] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setLocalKeys(apiKeys);
    }
  }, [isModalOpen]);

  const providerMeta: { id: 'exa'|'gemini'|'openai'|'groq'; label: string; required?: boolean; placeholder: string; link: string; description?: string }[] = [
    { id: 'exa', label: 'Exa API Key', required: true, placeholder: 'Required for search & news', link: 'https://dashboard.exa.ai/login', description: 'Core semantic + news retrieval. Mandatory.' },
    { id: 'gemini', label: 'Google Gemini API Key', placeholder: 'Optional, boosts analysis', link: 'https://aistudio.google.com/app/apikey' },
    { id: 'openai', label: 'OpenAI API Key', placeholder: 'Optional LLM fallback', link: 'https://platform.openai.com/api-keys' },
    { id: 'groq', label: 'Groq API Key', placeholder: 'Optional fast summaries', link: 'https://console.groq.com/keys' },
  ];

  const handleSave = async () => {
    setKeys(localKeys);
    closeModal();
    // Auto validate Exa only if it changed and present
    if (localKeys.exaApiKey && localKeys.exaApiKey !== apiKeys.exaApiKey) {
      setTimeout(() => validateProvider('exa'), 100);
    }
  };

  const providerKeyField = (id: string) => ({ exa: 'exaApiKey', gemini: 'geminiApiKey', openai: 'openAiApiKey', groq: 'groqApiKey' } as const)[id as 'exa'|'gemini'|'openai'|'groq'];

  const statusBadge = (id: 'exa'|'gemini'|'openai'|'groq') => {
    const v = validation[id];
    if (!v) return null;
    if (v.status === 'validating') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-300 border border-blue-400/20"><Loader2 className="w-3 h-3 animate-spin"/>Checking</span>;
    if (v.status === 'valid') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-400/30"><CheckCircle2 className="w-3 h-3"/>Valid</span>;
    if (v.status === 'invalid') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-300 border border-rose-400/30"><XCircle className="w-3 h-3"/>Invalid</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-600/30 text-slate-300 border border-slate-500/30">Unknown</span>;
  };

  const runValidate = async (id: 'exa'|'gemini'|'openai'|'groq') => {
    setTimeout(() => validateProvider(id), 50);
  };

  const runValidateAll = async () => {
    setBulkValidating(true);
    setTimeout(async () => {
      await validateAllProviders();
      setBulkValidating(false);
    }, 50);
  };

  const handleClearAll = () => {
    clearKeys();
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
        <div className="grid gap-6 py-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400 flex gap-3 items-start">
            <Shield className="w-4 h-4 text-cyan-300 mt-0.5" />
            <div>
              <p className="font-medium text-slate-300 mb-1">Local Only</p>
              <p>Keys persist in your browser storage and are injected client-side when starting a briefing. The server never stores them.</p>
            </div>
          </div>
          {providerMeta.map(p => {
            const field = providerKeyField(p.id);
            const inputId = `${p.id}-key`;
            const val = (localKeys as any)[field];
            return (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={inputId} className="flex items-center gap-1 text-sm">{p.label}{p.required && <span className="text-red-500">*</span>}</Label>
                  <div className="flex items-center gap-2">
                    {statusBadge(p.id)}
                    {val && <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-cyan-300" title="Validate" onClick={() => runValidate(p.id)}>
                      <RefreshCw className="w-3 h-3" />
                    </Button>}
                  </div>
                </div>
                <Input id={inputId} type="password" value={val} onChange={(e) => setLocalKeys({ ...localKeys, [field]: e.target.value })} placeholder={p.placeholder} />
                <div className="flex items-center justify-between">
                  <Link href={p.link} target="_blank" className="text-[11px] text-blue-500 hover:underline">Get key</Link>
                  {validation[p.id]?.message && validation[p.id].status === 'invalid' && (
                    <span className="text-[10px] text-rose-400">{validation[p.id].message}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2 order-2 sm:order-1 w-full sm:w-auto">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={handleClearAll}>Clear All</Button>
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" onClick={runValidateAll} disabled={bulkValidating}>
              {bulkValidating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Validating...</> : 'Validate All'}
            </Button>
          </div>
          <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
            <Button type="button" onClick={handleSave} className="flex-1 sm:flex-none">Save</Button>
            <Button type="button" variant="ghost" onClick={closeModal} className="flex-1 sm:flex-none">Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}