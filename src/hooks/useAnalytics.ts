"use client";

import { useCallback, useEffect, useState } from "react";
import type { TradeFilters } from "@/types/trade";
import { buildTradeQuery } from "@/hooks/useTrades";
import { TRADES_CHANGED_EVENT } from "@/contexts/TradeModalContext";
import type { FullAnalytics } from "@/lib/analytics";

export interface AnalyticsResponse {
  analytics: FullAnalytics;
  account: { id: string; name: string; currency: string; startingBalance: number; currentBalance: number };
  tradeCount: number;
}

export function useAnalytics(
  accountId: string | null,
  filters: TradeFilters = {},
  minConfluenceSample = 20,
  minRsiSample = 10
) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(filters);

  const load = useCallback(() => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    const qs = buildTradeQuery(accountId, filters);
    fetch(`/api/analytics?${qs}&minConfluenceSample=${minConfluenceSample}&minRsiSample=${minRsiSample}`)
      .then((res) => {
        if (!res.ok) throw new Error("Nepodařilo se načíst analytiku");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((e) => setError(e instanceof Error ? e.message : "Chyba"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, key, minConfluenceSample, minRsiSample]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener(TRADES_CHANGED_EVENT, load);
    return () => window.removeEventListener(TRADES_CHANGED_EVENT, load);
  }, [load]);

  return { data, loading, error, refresh: load };
}
