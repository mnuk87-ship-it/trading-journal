"use client";

import { useCallback, useEffect, useState } from "react";
import type { TradeDTO, TradeFilters } from "@/types/trade";
import { TRADES_CHANGED_EVENT } from "@/contexts/TradeModalContext";

export function buildTradeQuery(accountId: string, filters: TradeFilters = {}): string {
  const params = new URLSearchParams();
  params.set("accountId", accountId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  filters.instrument?.forEach((v) => params.append("instrument", v));
  filters.direction?.forEach((v) => params.append("direction", v));
  filters.session?.forEach((v) => params.append("session", v));
  filters.strategyId?.forEach((v) => params.append("strategyId", v));
  filters.result?.forEach((v) => params.append("result", v));
  filters.timeframe?.forEach((v) => params.append("timeframe", v));
  if (filters.isAPlus !== undefined) params.set("isAPlus", String(filters.isAPlus));
  if (filters.search) params.set("search", filters.search);

  // --- RSI filtry ---
  if (filters.rsi15mCrossed !== undefined) params.set("rsi15mCrossed", String(filters.rsi15mCrossed));
  if (filters.rsi5mCrossed !== undefined) params.set("rsi5mCrossed", String(filters.rsi5mCrossed));
  filters.rsi15mDirection?.forEach((v) => params.append("rsi15mDirection", v));
  filters.rsi5mDirection?.forEach((v) => params.append("rsi5mDirection", v));
  filters.rsi15mZone?.forEach((v) => params.append("rsi15mZone", v));
  filters.rsi5mZone?.forEach((v) => params.append("rsi5mZone", v));
  if (filters.rsi15mValueMin !== undefined) params.set("rsi15mValueMin", String(filters.rsi15mValueMin));
  if (filters.rsi15mValueMax !== undefined) params.set("rsi15mValueMax", String(filters.rsi15mValueMax));
  if (filters.rsi5mValueMin !== undefined) params.set("rsi5mValueMin", String(filters.rsi5mValueMin));
  if (filters.rsi5mValueMax !== undefined) params.set("rsi5mValueMax", String(filters.rsi5mValueMax));
  filters.rsiCombo?.forEach((v) => params.append("rsiCombo", v));
  return params.toString();
}

export function useTrades(accountId: string | null, filters: TradeFilters = {}) {
  const [trades, setTrades] = useState<TradeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(filters);

  const refresh = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const qs = buildTradeQuery(accountId, filters);
      const res = await fetch(`/api/trades?${qs}`);
      if (!res.ok) throw new Error("Nepodařilo se načíst obchody");
      const data = await res.json();
      setTrades(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, key]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    window.addEventListener(TRADES_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TRADES_CHANGED_EVENT, refresh);
  }, [refresh]);

  return { trades, loading, error, refresh };
}

export async function createTrade(payload: Record<string, unknown>) {
  const res = await fetch("/api/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data);
  return data as TradeDTO;
}

export async function updateTrade(id: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/trades/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data);
  return data as TradeDTO;
}

export async function deleteTrade(id: string) {
  const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Nepodařilo se smazat obchod");
  return true;
}

export class ApiError extends Error {
  details: unknown;
  constructor(details: unknown) {
    super("Validační chyba");
    this.details = details;
  }
}
