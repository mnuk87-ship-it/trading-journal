"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { TradeDTO } from "@/types/trade";

export const TRADES_CHANGED_EVENT = "tj:trades-changed";

interface TradeModalState {
  open: boolean;
  editingTrade: TradeDTO | null;
}

interface TradeModalContextValue extends TradeModalState {
  openNew: () => void;
  openEdit: (trade: TradeDTO) => void;
  close: () => void;
  notifySaved: () => void;
}

const TradeModalContext = createContext<TradeModalContextValue | null>(null);

export function TradeModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TradeModalState>({ open: false, editingTrade: null });

  const openNew = useCallback(() => setState({ open: true, editingTrade: null }), []);
  const openEdit = useCallback((trade: TradeDTO) => setState({ open: true, editingTrade: trade }), []);
  const close = useCallback(() => setState({ open: false, editingTrade: null }), []);
  const notifySaved = useCallback(() => {
    window.dispatchEvent(new Event(TRADES_CHANGED_EVENT));
  }, []);

  const value = useMemo(
    () => ({ ...state, openNew, openEdit, close, notifySaved }),
    [state, openNew, openEdit, close, notifySaved]
  );

  return <TradeModalContext.Provider value={value}>{children}</TradeModalContext.Provider>;
}

export function useTradeModal() {
  const ctx = useContext(TradeModalContext);
  if (!ctx) throw new Error("useTradeModal must be used within TradeModalProvider");
  return ctx;
}
