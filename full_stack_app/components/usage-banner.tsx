"use client";

import { useEffect, useState, useCallback } from "react";

export function UsageBanner() {
  const [data, setData] = useState<{ remaining: number; isPro: boolean } | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const usageData = await res.json();
        setData(usageData);
      }
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsage();

    // Listen for custom "refresh-usage" events from other components
    const handleRefresh = () => fetchUsage();
    window.addEventListener("refresh-usage", handleRefresh);
    
    return () => window.removeEventListener("refresh-usage", handleRefresh);
  }, [fetchUsage]);

  if (!data || data.isPro || data.remaining <= 0) {
    return null;
  }

  return (
    <div className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-500">
      <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
      Try your {data.remaining} free record{data.remaining !== 1 ? 's' : ''}
    </div>
  );
}
