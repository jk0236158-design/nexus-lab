"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Activity, ShieldCheck } from "lucide-react";

const baseNavItems = [
  { href: "/", label: "Home" },
  { href: "/knots", label: "Knots" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/agents", label: "Agents" },
  { href: "/chat", label: "Chat" },
];

const phase6NavItems = [
  { href: "/yuino-preview", label: "Yuino Preview", Icon: Sparkles },
  { href: "/dogfood", label: "Dogfood", Icon: Activity },
  { href: "/approval", label: "承認待ち", Icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border bg-foreground">
      <div className="flex h-14 items-center px-5">
        <span className="text-lg font-semibold tracking-tight text-muted-foreground">
          Ops Console
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {baseNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-foreground text-muted-foreground"
                  : "text-muted-foreground hover:bg-foreground hover:text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        <div className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Phase 6 Full Console
        </div>
        {phase6NavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-foreground text-muted-foreground"
                  : "text-muted-foreground hover:bg-foreground hover:text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
