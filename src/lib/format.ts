export function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("cs-CZ", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} ${currency === "USD" ? "$" : currency}`;
}

export function formatPlainCurrency(value: number | null | undefined, currency = "USD"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("cs-CZ", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} ${currency === "USD" ? "$" : currency}`;
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function formatRR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "" : ""}${value.toFixed(2)}R`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

export function formatDateCz(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

export function pnlColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-muted";
  if (value > 0) return "text-green";
  if (value < 0) return "text-red";
  return "text-muted";
}
