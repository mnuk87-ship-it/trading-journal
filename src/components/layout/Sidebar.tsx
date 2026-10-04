"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDictionary } from "@/lib/i18n";
import clsx from "clsx";

const ICONS: Record<string, string> = {
  dashboard: "⬚",
  trades: "⇄",
  calendar: "▦",
  analytics: "▲",
  strategies: "◈",
  sessions: "◷",
  psychology: "◐",
  reports: "▤",
  settings: "⚙",
};

const ITEMS: { key: keyof ReturnType<typeof useDictionary>["nav"]; href: string }[] = [
  { key: "dashboard", href: "/dashboard" },
  { key: "trades", href: "/trades" },
  { key: "calendar", href: "/calendar" },
  { key: "analytics", href: "/analytics" },
  { key: "strategies", href: "/strategies" },
  { key: "sessions", href: "/sessions" },
  { key: "psychology", href: "/psychology" },
  { key: "reports", href: "/reports" },
  { key: "settings", href: "/settings" },
];

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const dict = useDictionary();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 z-50 h-screen shrink-0 border-r border-card-border bg-surface transition-all duration-200 flex flex-col",
          collapsed ? "w-[72px]" : "w-[220px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-card-border">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-sm font-bold text-white shrink-0">
            T
          </div>
          {!collapsed && <span className="font-semibold text-sm tracking-tight">Trading Journal</span>}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                  active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground"
                )}
                title={collapsed ? dict.nav[item.key] : undefined}
              >
                <span className="w-4 text-center text-base leading-none">{ICONS[item.key]}</span>
                {!collapsed && <span>{dict.nav[item.key]}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-card-border text-muted hover:text-foreground text-xs"
        >
          {collapsed ? "»" : "« Sbalit"}
        </button>
      </aside>
    </>
  );
}
