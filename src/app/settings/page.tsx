"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { Card } from "@/components/ui/Card";
import { SESSIONS } from "@/types/trade";

export default function SettingsPage() {
  const { account, accountId, accounts, setAccountId, refreshAccounts } = useAccount();
  const [form, setForm] = useState({
    name: "",
    currency: "USD",
    startingBalance: "10000",
    defaultRiskPct: "1",
    defaultInstrument: "NQ",
    defaultSession: "New York",
    commissionPerSide: "0",
    timezone: "Europe/Prague",
    breakevenThreshold: "0",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newAccount, setNewAccount] = useState({ name: "", currency: "USD", startingBalance: "10000" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!account) return;
    setForm({
      name: account.name,
      currency: account.currency,
      startingBalance: String(account.startingBalance),
      defaultRiskPct: String(account.defaultRiskPct),
      defaultInstrument: account.defaultInstrument,
      defaultSession: account.defaultSession,
      commissionPerSide: String(account.commissionPerSide),
      timezone: account.timezone,
      breakevenThreshold: String(account.breakevenThreshold),
    });
  }, [account]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!accountId) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/accounts/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          currency: form.currency,
          startingBalance: Number(form.startingBalance),
          defaultRiskPct: Number(form.defaultRiskPct),
          defaultInstrument: form.defaultInstrument.toUpperCase(),
          defaultSession: form.defaultSession,
          commissionPerSide: Number(form.commissionPerSide),
          timezone: form.timezone,
          breakevenThreshold: Number(form.breakevenThreshold),
        }),
      });
      await refreshAccounts();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAccount() {
    if (!newAccount.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccount.name.trim(),
          currency: newAccount.currency,
          startingBalance: Number(newAccount.startingBalance),
        }),
      });
      const created = await res.json();
      await refreshAccounts();
      setAccountId(created.id);
      setNewAccount({ name: "", currency: "USD", startingBalance: "10000" });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm("Opravdu smazat tento účet včetně všech obchodů? Tuto akci nelze vrátit zpět.")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    const remaining = await refreshAccounts();
    if (remaining.length) setAccountId(remaining[0].id);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Nastavení</h1>
        <p className="text-sm text-muted">Správa účtů a výchozích hodnot</p>
      </div>

      <Card title="Účty">
        <div className="space-y-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                a.id === accountId ? "border-accent bg-accent-soft" : "border-card-border"
              }`}
            >
              <button onClick={() => setAccountId(a.id)} className="text-sm font-medium text-left flex-1">
                {a.name} <span className="text-muted-2 text-xs">({a.currency})</span>
              </button>
              <span className="text-xs text-muted mr-3">{a._count?.trades ?? 0} obchodů</span>
              {accounts.length > 1 && (
                <button onClick={() => handleDeleteAccount(a.id)} className="text-xs text-red hover:underline">
                  Smazat
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-card-border flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[140px]">
            <label>Název nového účtu</label>
            <input value={newAccount.name} onChange={(e) => setNewAccount((n) => ({ ...n, name: e.target.value }))} placeholder="např. FTMO Challenge" className="w-full" />
          </div>
          <div className="w-28">
            <label>Měna</label>
            <input value={newAccount.currency} onChange={(e) => setNewAccount((n) => ({ ...n, currency: e.target.value.toUpperCase() }))} className="w-full" />
          </div>
          <div className="w-36">
            <label>Počáteční balance</label>
            <input
              type="number"
              value={newAccount.startingBalance}
              onChange={(e) => setNewAccount((n) => ({ ...n, startingBalance: e.target.value }))}
              className="w-full"
            />
          </div>
          <button
            onClick={handleCreateAccount}
            disabled={creating || !newAccount.name.trim()}
            className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            + Vytvořit účet
          </button>
        </div>
      </Card>

      {account && (
        <Card title={`Výchozí nastavení účtu — ${account.name}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label>Název účtu</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label>Měna</label>
              <input value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
            </div>
            <div>
              <label>Počáteční balance</label>
              <input type="number" step="any" value={form.startingBalance} onChange={(e) => set("startingBalance", e.target.value)} />
            </div>
            <div>
              <label>Výchozí risk %</label>
              <input type="number" step="any" value={form.defaultRiskPct} onChange={(e) => set("defaultRiskPct", e.target.value)} />
            </div>
            <div>
              <label>Výchozí instrument</label>
              <input value={form.defaultInstrument} onChange={(e) => set("defaultInstrument", e.target.value.toUpperCase())} />
            </div>
            <div>
              <label>Výchozí session</label>
              <select value={form.defaultSession} onChange={(e) => set("defaultSession", e.target.value)}>
                {SESSIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Komise / strana</label>
              <input type="number" step="any" value={form.commissionPerSide} onChange={(e) => set("commissionPerSide", e.target.value)} />
            </div>
            <div>
              <label>Timezone</label>
              <input value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
            </div>
            <div>
              <label>Breakeven threshold (R)</label>
              <input type="number" step="any" value={form.breakevenThreshold} onChange={(e) => set("breakevenThreshold", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleSave} disabled={saving} className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? "Ukládám..." : "Uložit nastavení"}
            </button>
            {saved && <span className="text-sm text-green">Uloženo ✓</span>}
          </div>
        </Card>
      )}
    </div>
  );
}
