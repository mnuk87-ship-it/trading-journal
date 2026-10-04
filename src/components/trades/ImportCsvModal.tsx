"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { useAccount } from "@/contexts/AccountContext";

type TargetKey =
  | "date"
  | "time"
  | "instrument"
  | "direction"
  | "entryPrice"
  | "stopLoss"
  | "takeProfit"
  | "exitPrice"
  | "positionSize"
  | "session"
  | "timeframe"
  | "setup"
  | "fees";

const TARGET_FIELDS: { key: TargetKey; label: string; required?: boolean }[] = [
  { key: "date", label: "Date", required: true },
  { key: "time", label: "Time" },
  { key: "instrument", label: "Instrument", required: true },
  { key: "direction", label: "Direction", required: true },
  { key: "entryPrice", label: "Entry", required: true },
  { key: "stopLoss", label: "Stop Loss" },
  { key: "takeProfit", label: "Take Profit" },
  { key: "exitPrice", label: "Exit" },
  { key: "positionSize", label: "Position Size" },
  { key: "session", label: "Session" },
  { key: "timeframe", label: "Timeframe" },
  { key: "setup", label: "Setup" },
  { key: "fees", label: "Fees" },
];

export function ImportCsvModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { accountId } = useAccount();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<TargetKey, string>>>({});
  const [result, setResult] = useState<{ imported: number; total: number; errors: { row: number; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data);
        const cols = res.meta.fields ?? [];
        setColumns(cols);
        const autoMap: Partial<Record<TargetKey, string>> = {};
        for (const f of TARGET_FIELDS) {
          const match = cols.find((c) => c.toLowerCase().replace(/[^a-z]/g, "") === f.key.toLowerCase());
          if (match) autoMap[f.key] = match;
        }
        setMapping(autoMap);
      },
    });
  }

  async function handleImport() {
    if (!accountId) return;
    setImporting(true);
    const mappedRows = rows.map((r) => {
      const out: Record<string, string> = {};
      for (const [key, col] of Object.entries(mapping)) {
        if (col) out[key] = r[col];
      }
      return out;
    });
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        rows: mappedRows.map((r) => ({
          ...r,
          entryPrice: r.entryPrice ? Number(r.entryPrice) : undefined,
          stopLoss: r.stopLoss ? Number(r.stopLoss) : undefined,
          takeProfit: r.takeProfit ? Number(r.takeProfit) : undefined,
          exitPrice: r.exitPrice ? Number(r.exitPrice) : undefined,
          positionSize: r.positionSize ? Number(r.positionSize) : undefined,
          fees: r.fees ? Number(r.fees) : undefined,
        })),
      }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
    if (data.imported > 0) onImported();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border border-card-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
          <h2 className="text-base font-semibold">Import obchodů z CSV</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          {!columns.length && (
            <div>
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full border border-dashed border-card-border rounded-lg py-8 text-sm text-muted hover:border-accent"
              >
                Vybrat CSV soubor
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          )}

          {columns.length > 0 && !result && (
            <>
              <p className="text-xs text-muted">Nalezeno {rows.length} řádků. Namapuj sloupce CSV na pole aplikace:</p>
              <div className="grid grid-cols-2 gap-3">
                {TARGET_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label>
                      {f.label} {f.required && <span className="text-red">*</span>}
                    </label>
                    <select
                      value={mapping[f.key] ?? ""}
                      onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))}
                    >
                      <option value="">— nemapovat —</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-accent text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
              >
                {importing ? "Importuji..." : `Importovat ${rows.length} obchodů`}
              </button>
            </>
          )}

          {result && (
            <div className="space-y-2">
              <div className="text-sm">
                Importováno <span className="text-green font-semibold">{result.imported}</span> z {result.total} řádků.
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto text-xs text-red space-y-1 bg-red-soft rounded-lg p-3">
                  {result.errors.map((e, i) => (
                    <div key={i}>
                      Řádek {e.row}: {e.message}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={onClose} className="w-full bg-surface-2 border border-card-border text-sm py-2.5 rounded-lg">
                Zavřít
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
