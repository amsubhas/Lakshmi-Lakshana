"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard, Upload, CheckSquare, AlertTriangle,
  Settings, ScrollText, Globe,
} from "lucide-react";

const NAV = [
  { href: "/",            label: "Dashboard",  icon: LayoutDashboard },
  { href: "/import",      label: "Import",     icon: Upload },
  { href: "/verify",      label: "Verify",     icon: CheckSquare },
  { href: "/conflicts",   label: "Conflicts",  icon: AlertTriangle },
  { href: "/automation",  label: "Automation", icon: Globe },
  { href: "/logs",        label: "Logs",       icon: ScrollText },
  { href: "/settings",    label: "Settings",   icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-52 shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <p className="text-accent font-bold text-sm leading-tight">🕉 Sri Havyaka</p>
        <p className="text-muted text-xs mt-0.5">Data Entry Automation</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={clsx(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
              path === href
                ? "bg-accent/20 text-accent font-medium"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted text-center">v3.0 · Ubuntu + Vercel</p>
      </div>
    </aside>
  );
}
