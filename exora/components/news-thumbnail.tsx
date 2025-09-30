"use client";

import { useEffect, useState, useRef } from 'react';

interface NewsThumbnailProps {
  url: string;
  headline: string;
}

const getFaviconUrl = (url: string) => {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
  } catch {
    return null;
  }
};

export function NewsThumbnail({ url, headline }: NewsThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const didRequest = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const key = `ogcache:${url}`;
    // 1. Try sessionStorage cache
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached) as { imageUrl: string | null; ts: number };
        // 30 min TTL client-side
        if (Date.now() - parsed.ts < 1000 * 60 * 30) {
          setImageUrl(parsed.imageUrl ?? getFaviconUrl(url));
          setLoading(false);
          didRequest.current = true;
          return;
        }
      }
    } catch {}

    const fetchOgImage = async () => {
      if (didRequest.current) return; // Prevent duplicate fetch on fast remount
      didRequest.current = true;
      setLoading(true);
      try {
        const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
            const resolved = data.imageUrl || getFaviconUrl(url);
            if (isMounted) {
              setImageUrl(resolved);
            }
            try { sessionStorage.setItem(key, JSON.stringify({ imageUrl: data.imageUrl, ts: Date.now() })); } catch {}
        } else {
          if (isMounted) setImageUrl(getFaviconUrl(url));
        }
      } catch {
        if (isMounted) setImageUrl(getFaviconUrl(url));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOgImage();
    return () => { isMounted = false; };
  }, [url]);

  if (loading) return <div className="w-full h-full bg-slate-800/40 animate-pulse" />;

  if (!imageUrl) {
    return (
      <div className="w-full h-full bg-slate-700/40 flex items-center justify-center text-amber-300 text-lg font-medium">
        {(headline || 'N')[0]}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={headline}
      className="w-full h-full object-cover"
      onError={() => setImageUrl(getFaviconUrl(url))}
    />
  );
}
