// components/layout/navbar.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, Github, Star, KeyRound } from "lucide-react";
import { useApiKeyStore } from '@/lib/store';
import { HoverButton } from "@/components/ui/hover-button";

export function Navbar() {
  const [stars, setStars] = React.useState<number | null>(null);
  const [starLoading, setStarLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("https://api.github.com/repos/AdityaP700/Exora-task", { next: { revalidate: 300 } as any });
        if (!res.ok) throw new Error("Failed to load stars");
        const json = await res.json();
        if (mounted) setStars(json.stargazers_count ?? null);
      } catch {
        if (mounted) setStars(null);
      } finally {
        if (mounted) setStarLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);
  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Try to find a visible AI input textarea
    const el = document.querySelector<HTMLTextAreaElement>("textarea[placeholder*='company URL']") ||
      document.querySelector<HTMLTextAreaElement>("textarea[placeholder*='another company']") ||
      document.querySelector<HTMLTextAreaElement>("textarea");
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.focus(), 300);
    }
  };
  const navItems = [
    { name: "Search", icon: Search },
    {
      name: "GitHub",
      icon: Github,
      href: "https://github.com/AdityaP700/Exora-task",
      external: true,
    },
  ];
  const { openModal, exaApiKey } = useApiKeyStore();

  return (
  <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-2 sm:px-4">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 70, damping: 20 }}
        className="flex flex-wrap gap-2 items-center justify-between p-2 rounded-2xl bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 shadow-lg"
      >
        <nav className="flex items-center gap-1 flex-wrap">
          {navItems.map((item) => {
            if (item.name === 'Search') {
              return (
                <button
                  key={item.name}
                  onClick={handleSearchClick}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-full hover:bg-slate-800/50"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              )
            }
            return (
              <a
                key={item.name}
                href={item.href || "#"}
                target={item.external ? "_blank" : "_self"}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-full hover:bg-slate-800/50"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </a>
            )
          })}
        </nav>
  <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => openModal()}
            className="relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/40 text-slate-200 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>{exaApiKey ? 'API Keys' : 'Add Keys'}</span>
            {!exaApiKey && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />}
          </button>
          <a
          href="https://github.com/AdityaP700/Exora-task"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-slate-800/80 to-slate-700/60 hover:from-slate-700 hover:to-slate-600 border border-slate-600/60 text-slate-200 hover:text-white transition-colors"
        >
          <Star className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Star the Repo</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/70 border border-slate-600/50">
            {starLoading ? '…' : (stars ?? '—')}
          </span>
        </a>
        </div>
      </motion.div>
    </header>
  );
}
