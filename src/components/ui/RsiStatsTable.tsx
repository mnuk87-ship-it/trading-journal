import { formatPercent, formatPlainCurrency, formatRR, pnlColor } from "@/lib/format";
import type { RsiTimeframeStats } from "@/lib/analytics";

export interface RsiStatsRow extends RsiTimeframeStats {
  key: string;
  label: string;
}

/**
 * Tabulka pro RSI Cross statistiky (zóny, kombinace 15M/15M+5M/5M).
 * Řádky s menším vzorkem než minSampleSize se neschovávají, ale zvýrazní se
 * jako "Insufficient data" - uživatel vidí, že závěr z nich není spolehlivý.
 */
export function RsiStatsTable({
  rows,
  currency,
  keyLabel = "RSI",
  emptyMessage = "Žádná data.",
}: {
  rows: RsiStatsRow[];
  currency: string;
  keyLabel?: string;
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full text-xs">
        <thead className="bg-surface-2">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-muted whitespace-nowrap">{keyLabel}</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Trades</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Win Rate</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Avg RR</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Total R</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Expectancy</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Profit Factor</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">PnL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-card-border hover:bg-surface-2/50">
              <td className="px-3 py-2 font-medium whitespace-nowrap">{r.label}</td>
              <td className="px-3 py-2 text-right">
                {r.trades}{" "}
                <span className="text-muted-2">
                  ({r.wins}W/{r.losses}L/{r.be}BE)
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                {r.insufficientData ? (
                  <span className="text-muted-2 italic">Insufficient data</span>
                ) : (
                  formatPercent(r.winRate)
                )}
              </td>
              <td className="px-3 py-2 text-right">{formatRR(r.averageRR)}</td>
              <td className="px-3 py-2 text-right">{formatRR(r.totalR)}</td>
              <td className={`px-3 py-2 text-right font-semibold ${pnlColor(r.expectancy)}`}>
                {formatPlainCurrency(r.expectancy, currency)}
              </td>
              <td className="px-3 py-2 text-right">{Number.isFinite(r.profitFactor) ? r.profitFactor.toFixed(2) : "∞"}</td>
              <td className={`px-3 py-2 text-right font-semibold ${pnlColor(r.pnl)}`}>{formatPlainCurrency(r.pnl, currency)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
