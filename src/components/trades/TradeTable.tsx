"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TradeDTO } from "@/types/trade";
import { ResultBadge, DirectionBadge } from "@/components/ui/Badge";
import { formatDateCz, formatDuration, formatPlainCurrency, formatRR, pnlColor } from "@/lib/format";
import { useTradeModal } from "@/contexts/TradeModalContext";
import { deleteTrade } from "@/hooks/useTrades";

type SortKey = "date" | "instrument" | "pnl" | "rr";

export function TradeTable({ trades, currency, onChanged }: { trades: TradeDTO[]; currency: string; onChanged: () => void }) {
  const { openEdit } = useTradeModal();
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const sorted = useMemo(() => {
    const arr = [...trades];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
      if (sortKey === "instrument") cmp = a.instrument.localeCompare(b.instrument);
      if (sortKey === "pnl") cmp = (a.netPnl ?? 0) - (b.netPnl ?? 0);
      if (sortKey === "rr") cmp = (a.realizedRR ?? 0) - (b.realizedRR ?? 0);
      return cmp * sortDir;
    });
    return arr;
  }, [trades, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  function sortBy(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(-1);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tento obchod?")) return;
    await deleteTrade(id);
    onChanged();
  }

  const Th = ({ label, k }: { label: string; k?: SortKey }) => (
    <th
      className={`text-left px-3 py-2 font-medium text-muted whitespace-nowrap ${k ? "cursor-pointer hover:text-foreground" : ""}`}
      onClick={() => k && sortBy(k)}
    >
      {label} {k && sortKey === k ? (sortDir === 1 ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-card-border">
        <table className="w-full text-xs">
          <thead className="bg-surface-2 sticky top-0">
            <tr>
              <Th label="Datum" k="date" />
              <Th label="Instrument" k="instrument" />
              <Th label="Směr" />
              <Th label="Session" />
              <Th label="Setup" />
              <Th label="Entry" />
              <Th label="SL" />
              <Th label="TP" />
              <Th label="Exit" />
              <Th label="Risk %" />
              <Th label="PnL" k="pnl" />
              <Th label="RR" k="rr" />
              <Th label="Výsledek" />
              <Th label="Trvání" />
              <Th label="Foto" />
              <Th label="" />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((t) => (
              <tr key={t.id} className="border-t border-card-border hover:bg-surface-2/50">
                <td className="px-3 py-2 whitespace-nowrap">
                  <Link href={`/trades/${t.id}`} className="hover:text-accent">
                    {formatDateCz(t.date)} {t.time}
                  </Link>
                </td>
                <td className="px-3 py-2 font-medium">{t.instrument}</td>
                <td className="px-3 py-2">
                  <DirectionBadge direction={t.direction} />
                </td>
                <td className="px-3 py-2 text-muted">{t.session}</td>
                <td className="px-3 py-2 text-muted">{t.strategy?.name ?? "—"}</td>
                <td className="px-3 py-2">{t.entryPrice}</td>
                <td className="px-3 py-2">{t.stopLoss}</td>
                <td className="px-3 py-2">{t.takeProfit ?? "—"}</td>
                <td className="px-3 py-2">{t.exitPrice ?? "—"}</td>
                <td className="px-3 py-2">{t.riskPercent ? `${t.riskPercent.toFixed(2)}%` : "—"}</td>
                <td className={`px-3 py-2 font-semibold ${pnlColor(t.netPnl)}`}>{formatPlainCurrency(t.netPnl, currency)}</td>
                <td className="px-3 py-2">{formatRR(t.realizedRR)}</td>
                <td className="px-3 py-2">
                  <ResultBadge result={t.result} />
                </td>
                <td className="px-3 py-2 text-muted">{formatDuration(t.durationMinutes)}</td>
                <td className="px-3 py-2">{t.screenshots.length > 0 ? "📷" : "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button className="text-accent hover:underline" onClick={() => openEdit(t)}>
                      Upravit
                    </button>
                    <button className="text-red hover:underline" onClick={() => handleDelete(t.id)}>
                      Smazat
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={16} className="px-3 py-10 text-center text-muted">
                  Žádné obchody neodpovídají filtrům.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted">
        <span>
          {sorted.length} obchodů celkem · strana {page}/{totalPages}
        </span>
        <div className="flex gap-1">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded-md border border-card-border disabled:opacity-40">
            ‹
          </button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded-md border border-card-border disabled:opacity-40">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
