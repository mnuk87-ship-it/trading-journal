"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { formatPlainCurrency } from "@/lib/format";

export function BreakdownBarChart<T extends { key: string }>({
  data,
  dataKey = "pnl" as keyof T,
  currency = "USD",
  height = 260,
}: {
  data: T[];
  dataKey?: keyof T;
  currency?: string;
  height?: number;
}) {
  const dk = String(dataKey);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data as Record<string, unknown>[]} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#23232a" vertical={false} />
        <XAxis dataKey="key" stroke="#5e5e68" fontSize={11} tickLine={false} />
        <YAxis stroke="#5e5e68" fontSize={11} tickLine={false} axisLine={false} width={60} />
        <Tooltip
          contentStyle={{ background: "#141417", border: "1px solid #23232a", borderRadius: 10, fontSize: 12 }}
          formatter={(value) => [formatPlainCurrency(Number(value), currency), "PnL"]}
        />
        <Bar dataKey={dk} radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={(d[dataKey] as number) >= 0 ? "#22c55e" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
