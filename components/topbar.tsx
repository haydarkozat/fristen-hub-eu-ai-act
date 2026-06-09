"use client";

import { usePathname } from "next/navigation";
import { setLang } from "@/app/actions";
import { EntryModal, type EntryLabels } from "@/components/entry-modal";
import type { Lang } from "@/lib/i18n";

type Nav = { overview: string; drivers: string; vehicles: string; calendar: string; aiAct: string };
type Field = { key: string; label: string; mode: string };

export function Topbar({
  nav,
  todayLabel,
  todayPrefix,
  lang,
  driverFields,
  vehicleFields,
  entryLabels,
}: {
  nav: Nav;
  todayLabel: string;
  todayPrefix: string;
  lang: Lang;
  driverFields: Field[];
  vehicleFields: Field[];
  entryLabels: EntryLabels;
}) {
  const path = usePathname();
  const title =
    path === "/dashboard/drivers"
      ? nav.drivers
      : path === "/dashboard/vehicles"
        ? nav.vehicles
        : path === "/dashboard/calendar"
          ? nav.calendar
          : path.startsWith("/dashboard/ai-act")
            ? nav.aiAct
            : nav.overview;

  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="right">
        <span className="date">
          {todayPrefix} · {todayLabel}
        </span>
        <EntryModal driverFields={driverFields} vehicleFields={vehicleFields} labels={entryLabels} />
        <div className="langswitch">
          <form action={setLang}>
            <input type="hidden" name="lang" value="de" />
            <button type="submit" className={lang === "de" ? "active" : ""}>
              DE
            </button>
          </form>
          <form action={setLang}>
            <input type="hidden" name="lang" value="tr" />
            <button type="submit" className={lang === "tr" ? "active" : ""}>
              TR
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
