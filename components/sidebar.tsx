"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";

type Nav = { overview: string; drivers: string; vehicles: string; calendar: string; aiAct: string };

export function Sidebar({
  nav,
  management,
  logoutLabel,
  counts,
}: {
  nav: Nav;
  management: string;
  logoutLabel: string;
  counts: { drivers: number; vehicles: number; aiSystems: number };
}) {
  const path = usePathname();
  const items = [
    { href: "/dashboard", icon: "▣", label: nav.overview },
    { href: "/dashboard/drivers", icon: "☷", label: nav.drivers, badge: counts.drivers },
    { href: "/dashboard/vehicles", icon: "▤", label: nav.vehicles, badge: counts.vehicles },
    { href: "/dashboard/calendar", icon: "▦", label: nav.calendar },
    { href: "/dashboard/ai-act", icon: "◈", label: nav.aiAct, badge: counts.aiSystems },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">
          Fristen<span>·</span>Hub
        </div>
        <div className="sub">Fuhrpark &amp; Fahrer</div>
      </div>
      <nav>
        <div className="label">{management}</div>
        {items.map((it) => {
          // Alt sayfalarda da (ör. /dashboard/ai-act/new) sekme aktif kalsın.
          const active = path === it.href || (it.href !== "/dashboard" && path.startsWith(`${it.href}/`));
          return (
            <Link key={it.href} href={it.href} className={`navitem${active ? " active" : ""}`}>
              <span className="ic">{it.icon}</span> {it.label}
              {typeof it.badge === "number" ? <span className="badge">{it.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="sidefoot">
        <strong>Demo Transport &amp; Logistik GmbH</strong>
        <br />
        Musterstraße 1 · 10115 Berlin
        <br />
        Tel. +49 30 1234567
        <br />
        info@demo-logistik.example
        <form action={logout}>
          <button type="submit" className="logout-btn">
            {logoutLabel}
          </button>
        </form>
      </div>
    </aside>
  );
}
