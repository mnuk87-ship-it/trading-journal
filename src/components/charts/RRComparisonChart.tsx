"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatDateCz } from "@/lib/format";

export function RRComparisonChart({ data }: { data: { date: string; ideal: number; realized: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#23232a" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d) => formatDateCz(d)} stroke="#5e5e68" fontSize={11} tickLine={false} minTickGap={30} />
        <YAxis stroke="#5e5e68" fontSize={11} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: "#141417", border: "1px solid #23232a", borderRadius: 10, fontSize: 12 }}
          labelFormatter={(d) => formatDateCz(String(d))}
          formatter={(value, name) => [`${Number(value).toFixed(2)}R`, name === "ideal" ? "Ideal RR" : "Realized RR"]}
        />
        <Legend formatter={(v) => (v === "ideal" ? "Ideal RR" : "Realized RR")} wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="ideal" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="realized" stroke="#22c55e" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
