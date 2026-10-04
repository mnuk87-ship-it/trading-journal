"use client";

import { useMemo, useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { useStrategies } from "@/hooks/useStrategies";
import { useAnalytics, type AnalyticsResponse } from "@/hooks/useAnalytics";
import { Card } from "@/components/ui/Card";
import { formatPercent, formatPlainCurrency, formatRR, pnlColor } from "@/lib/format";

type StrategyStat = AnalyticsResponse["analytics"]["byStrategy"][number];

export default function StrategiesPage() {
  const { accountId } = useAccount();
  const { strategies, createStrategy, deleteStrategy } = useStrategies(accountId);
  const { data, loading, error } = useAnalytics(accountId, {});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const statsByName = useMemo(() => {
    const m = new Map<string, StrategyStat>();
    if (!data) return m;
    for (const s of data.analytics.byStrategy) m.set(s.key, s);
    return m;
  }, [data]);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createStrategy(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Smazat tento setup? Obchody s tímto setupem zůstanou, jen ztratí navázání.")) return;
    await deleteStrategy(id);
  }

  const currency = data?.account.currency ?? "USD";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Strategie / Setupy</h1>
        <p className="text-sm text-muted">Správa obchodních setupů a jejich výkonnosti</p>
      </div>

      <Card title="Nový setup">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label>Název</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Breakout" className="w-full" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label>Popis (volitelné)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full" />
          </div>
          <button
            onClick={handleCreate}
            disabled={submitting || !name.trim()}
            className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Vytvořit
          </button>
        </div>
      </Card>

      <Card title="Přehled setupů">
        {loading ? (
          <div className="text-muted text-sm">Načítám...</div>
        ) : error ? (
          <div className="text-red text-sm">{error}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-card-border">
            <table className="w-full text-xs">
              <thead className="bg-surface-2">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted">Setup</th>
                  <th className="text-left px-3 py-2 font-medium text-muted">Popis</th>
                  <th className="text-right px-3 py-2 font-medium text-muted">Trades</th>
                  <th className="text-right px-3 py-2 font-medium text-muted">Win Rate</th>
                  <th className="text-right px-3 py-2 font-medium text-muted">PnL</th>
                  <th className="text-right px-3 py-2 font-medium text-muted">Avg RR</th>
                  <th className="text-right px-3 py-2 font-medium text-muted">Profit Factor</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((s) => {
                  const stat = statsByName.get(s.name);
                  return (
                    <tr key={s.id} className="border-t border-card-border hover:bg-surface-2/50">
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{s.name}</td>
                      <td className="px-3 py-2 text-muted">{s.description ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{stat?.trades ?? 0}</td>
                      <td className="px-3 py-2 text-right">{stat ? formatPercent(stat.winRate) : "—"}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${pnlColor(stat?.pnl)}`}>
                        {stat ? formatPlainCurrency(stat.pnl, currency) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{stat ? formatRR(stat.averageRR) : "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {stat ? (Number.isFinite(stat.profitFactor) ? stat.profitFactor.toFixed(2) : "∞") : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => handleDelete(s.id)} className="text-red hover:underline">
                          Smazat
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {strategies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted">
                      Žádné setupy. Vytvoř první výše.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
