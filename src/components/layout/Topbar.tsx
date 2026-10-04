"use client";

import { useAccount } from "@/contexts/AccountContext";
import { useTradeModal } from "@/contexts/TradeModalContext";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { accounts, accountId, setAccountId, account } = useAccount();
  const { openNew } = useTradeModal();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-card-border bg-surface/80 backdrop-blur flex items-center justify-between px-4 lg:px-6 gap-3">
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-muted text-xl" onClick={onMenuClick}>
          ☰
        </button>
        <select
          value={accountId ?? ""}
          onChange={(e) => setAccountId(e.target.value)}
          className="bg-surface-2 text-sm font-medium py-1.5 px-2 rounded-lg border border-card-border min-w-[160px]"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {account && (
          <span className="hidden sm:inline text-xs text-muted">
            Balance:{" "}
            <span className="text-foreground font-medium">
              {account.startingBalance.toLocaleString("cs-CZ")} {account.currency}
            </span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={openNew}
          className="bg-accent hover:bg-accent/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Nový obchod
        </button>
      </div>
    </header>
  );
}
