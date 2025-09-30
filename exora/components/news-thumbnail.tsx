"use client";

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    let isMounted = true;
    const fetchOgImage = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.imageUrl) {
            setImageUrl(data.imageUrl);
          } else if (isMounted) {
            setImageUrl(getFaviconUrl(url));
          }
        } else {
           if (isMounted) {
            setImageUrl(getFaviconUrl(url));
          }
        }
      } catch (error) {
        if (isMounted) {
          setImageUrl(getFaviconUrl(url));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOgImage();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-full bg-slate-700/40 animate-pulse" />
    );
  }

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
