"use client";

import { SESSIONS, DIRECTIONS, TIMEFRAMES } from "@/types/trade";
import type { TradeFilters } from "@/types/trade";
import { dictionary } from "@/lib/i18n";
import { useInstruments, useStrategies } from "@/hooks/useStrategies";
import { useAccount } from "@/contexts/AccountContext";
import { RSI_ZONES, RSI_DIRECTIONS, rsiZoneLabel } from "@/lib/rsi";

const RSI_COMBOS = ["15M", "15M+5M", "5M"] as const;

export function FilterBar({
  filters,
  onChange,
  showSearch = true,
}: {
  filters: TradeFilters;
  onChange: (f: TradeFilters) => void;
  showSearch?: boolean;
}) {
  const { accountId } = useAccount();
  const { instruments } = useInstruments(accountId);
  const { strategies } = useStrategies(accountId);

  type MultiKey =
    | "instrument"
    | "direction"
    | "session"
    | "timeframe"
    | "strategyId"
    | "result"
    | "rsi15mDirection"
    | "rsi5mDirection"
    | "rsi15mZone"
    | "rsi5mZone"
    | "rsiCombo";

  function toggleMulti<K extends MultiKey>(key: K, value: string) {
    const current = (filters[key] as string[] | undefined) ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next.length ? next : undefined });
  }

  const active = (key: MultiKey, value: string) => ((filters[key] as string[] | undefined) ?? []).includes(value);

  // Tri-stavový toggle pro boolean filtry (undefined = "vše", true/false = aktivní volba).
  function toggleTriBool(key: "rsi15mCrossed" | "rsi5mCrossed", value: boolean) {
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="!mb-0 text-xs">Od</label>
          <input type="date" value={filters.from ?? ""} onChange={(e) => onChange({ ...filters, from: e.target.value || undefined })} />
        </div>
        <div className="flex items-center gap-2">
          <label className="!mb-0 text-xs">Do</label>
          <input type="date" value={filters.to ?? ""} onChange={(e) => onChange({ ...filters, to: e.target.value || undefined })} />
        </div>
        {showSearch && (
          <input
            placeholder="Hledat (instrument, setup, notes, ID)..."
            value={filters.search ?? ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
            className="flex-1 min-w-[200px]"
          />
        )}
        <label className="flex items-center gap-1.5 text-xs !mb-0">
          <input
            type="checkbox"
            checked={filters.isAPlus === true}
            onChange={(e) => onChange({ ...filters, isAPlus: e.target.checked ? true : undefined })}
          />
          Pouze A+
        </label>
        <button
          onClick={() => onChange({})}
          className="text-xs text-muted hover:text-foreground ml-auto"
        >
          Vymazat filtry
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <FilterGroup label="Instrument">
          {instruments.map((i) => (
            <Chip key={i} label={i} active={active("instrument", i)} onClick={() => toggleMulti("instrument", i)} />
          ))}
        </FilterGroup>
        <FilterGroup label="Směr">
          {DIRECTIONS.map((d) => (
            <Chip key={d} label={d} active={active("direction", d)} onClick={() => toggleMulti("direction", d)} />
          ))}
        </FilterGroup>
        <FilterGroup label="Session">
          {SESSIONS.map((s) => (
            <Chip key={s} label={dictionary.session[s]} active={active("session", s)} onClick={() => toggleMulti("session", s)} />
          ))}
        </FilterGroup>
        <FilterGroup label="Timeframe">
          {TIMEFRAMES.map((t) => (
            <Chip key={t} label={t} active={active("timeframe", t)} onClick={() => toggleMulti("timeframe", t)} />
          ))}
        </FilterGroup>
        <FilterGroup label="Výsledek">
          {["WIN", "LOSS", "BE"].map((r) => (
            <Chip key={r} label={r} active={active("result", r)} onClick={() => toggleMulti("result", r)} />
          ))}
        </FilterGroup>
        <FilterGroup label="Setup">
          {strategies.map((s) => (
            <Chip key={s.id} label={s.name} active={active("strategyId", s.id)} onClick={() => toggleMulti("strategyId", s.id)} />
          ))}
        </FilterGroup>
      </div>

      <div className="flex flex-wrap gap-4 text-xs border-t border-card-border pt-3">
        <FilterGroup label="RSI 15M Cross">
          <Chip label="Ano" active={filters.rsi15mCrossed === true} onClick={() => toggleTriBool("rsi15mCrossed", true)} />
          <Chip label="Ne" active={filters.rsi15mCrossed === false} onClick={() => toggleTriBool("rsi15mCrossed", false)} />
        </FilterGroup>
        <FilterGroup label="RSI 5M Cross">
          <Chip label="Ano" active={filters.rsi5mCrossed === true} onClick={() => toggleTriBool("rsi5mCrossed", true)} />
          <Chip label="Ne" active={filters.rsi5mCrossed === false} onClick={() => toggleTriBool("rsi5mCrossed", false)} />
        </FilterGroup>
        <FilterGroup label="RSI Kombinace">
          {RSI_COMBOS.map((c) => (
            <Chip key={c} label={c} active={active("rsiCombo", c)} onClick={() => toggleMulti("rsiCombo", c)} />
          ))}
        </FilterGroup>
        <FilterGroup label="15M Směr">
          {RSI_DIRECTIONS.map((d) => (
            <Chip key={d} label={d} active={active("rsi15mDirection", d)} onClick={() => toggleMulti("rsi15mDirection", d)} />
          ))}
        </FilterGroup>
        <FilterGroup label="5M Směr">
          {RSI_DIRECTIONS.map((d) => (
            <Chip key={d} label={d} active={active("rsi5mDirection", d)} onClick={() => toggleMulti("rsi5mDirection", d)} />
          ))}
        </FilterGroup>
        <FilterGroup label="15M Zóna">
          {RSI_ZONES.map((z) => (
            <Chip key={z} label={rsiZoneLabel(z)} active={active("rsi15mZone", z)} onClick={() => toggleMulti("rsi15mZone", z)} />
          ))}
        </FilterGroup>
        <FilterGroup label="5M Zóna">
          {RSI_ZONES.map((z) => (
            <Chip key={z} label={rsiZoneLabel(z)} active={active("rsi5mZone", z)} onClick={() => toggleMulti("rsi5mZone", z)} />
          ))}
        </FilterGroup>
        <div className="flex items-center gap-2">
          <span className="text-muted-2">15M RSI</span>
          <input
            type="number"
            placeholder="min"
            className="w-16 text-xs"
            value={filters.rsi15mValueMin ?? ""}
            onChange={(e) => onChange({ ...filters, rsi15mValueMin: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
          <span className="text-muted-2">–</span>
          <input
            type="number"
            placeholder="max"
            className="w-16 text-xs"
            value={filters.rsi15mValueMax ?? ""}
            onChange={(e) => onChange({ ...filters, rsi15mValueMax: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-2">5M RSI</span>
          <input
            type="number"
            placeholder="min"
            className="w-16 text-xs"
            value={filters.rsi5mValueMin ?? ""}
            onChange={(e) => onChange({ ...filters, rsi5mValueMin: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
          <span className="text-muted-2">–</span>
          <input
            type="number"
            placeholder="max"
            className="w-16 text-xs"
            value={filters.rsi5mValueMax ?? ""}
            onChange={(e) => onChange({ ...filters, rsi5mValueMax: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-muted-2 mr-1">{label}:</span>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-md border text-[11px] font-medium transition-colors ${
        active ? "bg-accent text-white border-accent" : "border-card-border text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
