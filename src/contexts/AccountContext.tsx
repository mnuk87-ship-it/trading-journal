"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface AccountSummary {
  id: string;
  name: string;
  currency: string;
  startingBalance: number;
  defaultRiskPct: number;
  defaultInstrument: string;
  defaultSession: string;
  commissionPerSide: number;
  timezone: string;
  breakevenThreshold: number;
  _count?: { trades: number };
}

interface AccountContextValue {
  accounts: AccountSummary[];
  accountId: string | null;
  account: AccountSummary | null;
  setAccountId: (id: string) => void;
  loading: boolean;
  refreshAccounts: () => Promise<AccountSummary[]>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

const STORAGE_KEY = "tj.accountId";

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts");
    const data: AccountSummary[] = await res.json();
    setAccounts(data);
    return data;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await refreshAccounts();
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const valid = stored && data.some((a) => a.id === stored);
      setAccountIdState(valid ? stored : data[0]?.id ?? null);
      setLoading(false);
    })();
  }, [refreshAccounts]);

  const setAccountId = useCallback((id: string) => {
    setAccountIdState(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const account = useMemo(() => accounts.find((a) => a.id === accountId) ?? null, [accounts, accountId]);

  const value = useMemo(
    () => ({ accounts, accountId, account, setAccountId, loading, refreshAccounts }),
    [accounts, accountId, account, setAccountId, loading, refreshAccounts]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
