import { formatPercent, formatPlainCurrency, formatRR, formatDuration, pnlColor } from "@/lib/format";

export interface StatsRow {
  key: string;
  trades: number;
  wins: number;
  losses: number;
  be: number;
  winRate: number;
  pnl: number;
  averageRR: number;
  profitFactor: number;
  expectancy: number;
  averageDuration: number;
}

export function StatsTable({
  rows,
  currency,
  keyLabel = "Skupina",
}: {
  rows: StatsRow[];
  currency: string;
  keyLabel?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full text-xs">
        <thead className="bg-surface-2">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-muted whitespace-nowrap">{keyLabel}</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Trades</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Win Rate</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">PnL</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Avg RR</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Profit Factor</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Expectancy</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Avg Trvání</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-card-border hover:bg-surface-2/50">
              <td className="px-3 py-2 font-medium whitespace-nowrap">{r.key}</td>
              <td className="px-3 py-2 text-right">
                {r.trades}{" "}
                <span className="text-muted-2">
                  ({r.wins}W/{r.losses}L/{r.be}BE)
                </span>
              </td>
              <td className="px-3 py-2 text-right">{formatPercent(r.winRate)}</td>
              <td className={`px-3 py-2 text-right font-semibold ${pnlColor(r.pnl)}`}>{formatPlainCurrency(r.pnl, currency)}</td>
              <td className="px-3 py-2 text-right">{formatRR(r.averageRR)}</td>
              <td className="px-3 py-2 text-right">{Number.isFinite(r.profitFactor) ? r.profitFactor.toFixed(2) : "∞"}</td>
              <td className="px-3 py-2 text-right">{formatPlainCurrency(r.expectancy, currency)}</td>
              <td className="px-3 py-2 text-right">{formatDuration(r.averageDuration)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-muted">
                Žádná data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
