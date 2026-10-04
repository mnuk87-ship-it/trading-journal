"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { EquityPoint } from "@/lib/analytics";
import { formatDateCz, formatPlainCurrency } from "@/lib/format";

type Mode = "balance" | "pnl" | "pnlPercent";

export function EquityCurveChart({ data, currency = "USD" }: { data: EquityPoint[]; currency?: string }) {
  const [mode, setMode] = useState<Mode>("balance");
  const [showDrawdown, setShowDrawdown] = useState(true);

  const key = mode === "balance" ? "balance" : mode === "pnl" ? "cumulativePnl" : "pnlPercent";
  const color = "#3b82f6";

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-1 bg-surface-2 rounded-lg p-1">
          {(
            [
              ["balance", "Balance"],
              ["pnl", "PnL"],
              ["pnlPercent", "PnL %"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                mode === m ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
          <input type="checkbox" checked={showDrawdown} onChange={(e) => setShowDrawdown(e.target.checked)} />
          Zobrazit drawdown
        </label>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#23232a" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => formatDateCz(d)}
            stroke="#5e5e68"
            fontSize={11}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis stroke="#5e5e68" fontSize={11} tickLine={false} axisLine={false} width={70} />
          <Tooltip
            contentStyle={{ background: "#141417", border: "1px solid #23232a", borderRadius: 10, fontSize: 12 }}
            labelFormatter={(d) => formatDateCz(String(d))}
            formatter={(value, name) => {
              const num = Number(value);
              if (name === key) {
                if (mode === "pnlPercent") return [`${num.toFixed(2)}%`, "PnL %"];
                return [formatPlainCurrency(num, currency), mode === "balance" ? "Balance" : "PnL"];
              }
              return [String(value), String(name)];
            }}
          />
          {showDrawdown && (
            <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="url(#ddFill)" strokeWidth={1} name="Drawdown" />
          )}
          <Area type="monotone" dataKey={key} stroke={color} fill="url(#equityFill)" strokeWidth={2} name={key} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
