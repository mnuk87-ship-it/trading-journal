"use client";

import { useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { useTrades, buildTradeQuery } from "@/hooks/useTrades";
import { FilterBar } from "@/components/trades/FilterBar";
import { TradeTable } from "@/components/trades/TradeTable";
import { ImportCsvModal } from "@/components/trades/ImportCsvModal";
import type { TradeFilters } from "@/types/trade";

export default function TradesPage() {
  const { accountId, account } = useAccount();
  const [filters, setFilters] = useState<TradeFilters>({});
  const { trades, loading, error, refresh } = useTrades(accountId, filters);
  const [importOpen, setImportOpen] = useState(false);

  function exportFile(format: "csv" | "json") {
    if (!accountId) return;
    const qs = buildTradeQuery(accountId, filters);
    window.open(`/api/export?${qs}&format=${format}`, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Obchody</h1>
          <p className="text-sm text-muted">Kompletní seznam zapsaných obchodů</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)} className="text-xs px-3 py-2 rounded-lg border border-card-border hover:border-accent">
            Import CSV
          </button>
          <button onClick={() => exportFile("csv")} className="text-xs px-3 py-2 rounded-lg border border-card-border hover:border-accent">
            Export CSV
          </button>
          <button onClick={() => exportFile("json")} className="text-xs px-3 py-2 rounded-lg border border-card-border hover:border-accent">
            Export JSON
          </button>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {loading && <div className="text-muted text-sm">Načítám...</div>}
      {error && <div className="text-red text-sm">{error}</div>}
      {!loading && !error && account && <TradeTable trades={trades} currency={account.currency} onChanged={refresh} />}

      {importOpen && <ImportCsvModal onClose={() => setImportOpen(false)} onImported={refresh} />}
    </div>
  );
}
