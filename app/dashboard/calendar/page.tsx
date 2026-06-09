import { Pill } from "@/components/pill";
import { docLabel, type DeadlineRow, getDeadlines } from "@/lib/deadlines";
import { fmtDayMonth, fmtMonth } from "@/lib/format";
import { getLang, t } from "@/lib/i18n";

export default async function CalendarPage() {
  const lang = await getLang();
  const dict = t(lang);
  const deadlines = await getDeadlines(); // due_date ASC

  // Aya göre grupla (sıra korunur).
  const groups: { key: string; items: DeadlineRow[] }[] = [];
  for (const x of deadlines) {
    const key = fmtMonth(x.dueDate, dict.locale);
    let g = groups.find((gr) => gr.key === key);
    if (!g) {
      g = { key, items: [] };
      groups.push(g);
    }
    g.items.push(x);
  }

  return (
    <>
      <div className="sec-head">
        <h2>{dict.calendarTitle}</h2>
        <span className="count">{dict.calendarSub}</span>
      </div>
      {groups.length === 0 ? (
        <div className="panel">
          <div className="empty">{dict.calendarEmpty}</div>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key}>
            <div className="cal-month">{g.key}</div>
            {g.items.map((x) => (
              <div key={x.id} className="cal-row">
                <span className="cdate">{fmtDayMonth(x.dueDate)}</span>
                <span className="cwho">{x.subject}</span>
                <span className="cdoc">{docLabel(x, lang)}</span>
                <span>
                  <Pill
                    status={x.status}
                    daysLeft={x.daysLeft}
                    mode={x.mode}
                    dueDate={x.dueDate}
                    dict={dict}
                    locale={dict.locale}
                  />
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </>
  );
}
