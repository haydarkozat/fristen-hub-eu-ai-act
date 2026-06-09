// Durum etiketi (yeşil/sarı/kırmızı). Sunucu bileşeni.
import type { Status } from "@/lib/deadlines";
import { fmtDate } from "@/lib/format";
import type { Dict } from "@/lib/i18n";

function statusLabel(status: Status, daysLeft: number | null, mode: string, dict: Dict): string {
  if (status === "none" || daysLeft === null) return dict.none;
  if (status === "bad") return mode === "interval" ? dict.overdue : dict.expired;
  if (status === "warn") return `${daysLeft} ${dict.daysShort}`;
  return mode === "interval" ? `${daysLeft} ${dict.daysShort}` : dict.valid;
}

export function Pill({
  status,
  daysLeft,
  mode,
  dueDate,
  dict,
  locale,
}: {
  status: Status;
  daysLeft: number | null;
  mode: string;
  dueDate?: Date;
  dict: Dict;
  locale: string;
}) {
  const label = statusLabel(status, daysLeft, mode, dict);
  const showDate = (status === "warn" || status === "bad") && dueDate;
  return (
    <span>
      <span className={`pill ${status}`}>{label}</span>
      {showDate ? (
        <span
          style={{
            marginLeft: 5,
            fontSize: 12,
            color: "var(--ink-soft)",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          {fmtDate(dueDate, locale)}
        </span>
      ) : null}
    </span>
  );
}
