"use client";

import { useCallback, useEffect, useState } from "react";
import type { StrategyDTO } from "@/types/trade";

export function useStrategies(accountId: string | null) {
  const [strategies, setStrategies] = useState<StrategyDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    const res = await fetch(`/api/strategies?accountId=${accountId}`);
    setStrategies(await res.json());
    setLoading(false);
  }, [accountId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createStrategy = useCallback(
    async (name: string, description?: string) => {
      if (!accountId) return;
      await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, name, description }),
      });
      await refresh();
    },
    [accountId, refresh]
  );

  const deleteStrategy = useCallback(
    async (id: string) => {
      await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      await refresh();
    },
    [refresh]
  );

  return { strategies, loading, refresh, createStrategy, deleteStrategy };
}

export function useInstruments(accountId: string | null) {
  const [instruments, setInstruments] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!accountId) return;
    const res = await fetch(`/api/instruments?accountId=${accountId}`);
    setInstruments(await res.json());
  }, [accountId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addInstrument = useCallback(
    async (symbol: string) => {
      if (!accountId) return;
      await fetch("/api/instruments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, symbol }),
      });
      await refresh();
    },
    [accountId, refresh]
  );

  return { instruments, refresh, addInstrument };
}
