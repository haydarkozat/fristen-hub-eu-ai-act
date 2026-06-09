import Link from "next/link";
import { getAiSummary } from "@/lib/ai-act";
import { docLabel, getCounts, getDeadlines } from "@/lib/deadlines";
import { fmtDate } from "@/lib/format";
import { getLang, t } from "@/lib/i18n";

export default async function OverviewPage() {
  const lang = await getLang();
  const dict = t(lang);
  const [deadlines, counts, ai] = await Promise.all([getDeadlines(), getCounts(), getAiSummary()]);

  const warn = deadlines.filter((d) => d.status === "warn");
  const bad = deadlines.filter((d) => d.status === "bad");
  const critical = [...bad, ...warn].sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <>
      <div className="kpis">
        <div className="kpi neutral">
          <span className="stripe" />
          <div className="top">{dict.kpiDrivers}</div>
          <div className="num">{counts.drivers}</div>
          <div className="foot">{dict.kpiDriversFoot}</div>
        </div>
        <div className="kpi accent">
          <span className="stripe" />
          <div className="top">{dict.kpiVehicles}</div>
          <div className="num">{counts.vehicles}</div>
          <div className="foot">{dict.kpiVehiclesFoot}</div>
        </div>
        <div className="kpi warn">
          <span className="stripe" />
          <div className="top">{dict.kpiWarn}</div>
          <div className="num">{warn.length}</div>
          <div className="foot">{dict.kpiWarnFoot}</div>
        </div>
        <div className="kpi bad">
          <span className="stripe" />
          <div className="top">{dict.kpiBad}</div>
          <div className="num">{bad.length}</div>
          <div className="foot">{dict.kpiBadFoot}</div>
        </div>
      </div>

      {/* ── EU AI Act özeti ── */}
      <div className="sec-head">
        <h2>{dict.nav.aiAct}</h2>
        <Link href="/dashboard/ai-act" className="count" style={{ marginLeft: "auto", textDecoration: "none" }}>
          {dict.aiTitle} →
        </Link>
      </div>
      <div className="kpis">
        <div className="kpi neutral">
          <span className="stripe" />
          <div className="top">{dict.aiKpi}</div>
          <div className="num">{ai.total}</div>
          <div className="foot">{dict.aiKpiFoot}</div>
        </div>
        <div className="kpi bad">
          <span className="stripe" />
          <div className="top">{dict.aiKpiHigh}</div>
          <div className="num">{ai.highRisk}</div>
          <div className="foot">{dict.aiKpiHighFoot}</div>
        </div>
        <div className={`kpi ${ai.daysToDeadline < 0 ? "bad" : "warn"}`}>
          <span className="stripe" />
          <div className="top">{dict.aiKpiDeadline}</div>
          <div className="num">{ai.daysToDeadline}</div>
          <div className="foot">{dict.aiKpiDeadlineFoot}</div>
        </div>
      </div>

      <div className="sec-head">
        <h2>{dict.criticalTitle}</h2>
        <span className="count">{dict.needAttention(critical.length)}</span>
      </div>
      <div className="panel">
        {critical.length === 0 ? (
          <div className="empty">{dict.noCritical}</div>
        ) : (
          critical.map((x) => {
            const due =
              x.daysLeft < 0 ? dict.overdueBy(Math.abs(x.daysLeft)) : dict.inDays(x.daysLeft);
            const meta =
              x.appliesTo === "vehicle"
                ? x.meta
                : x.appliesTo === "ai_system"
                  ? dict.nav.aiAct
                  : dict.colDriver;
            return (
              <div key={x.id} className={`alert ${x.status}`}>
                <span className="dot" />
                <div className="who">
                  {x.subject}
                  <div className="meta">{meta}</div>
                </div>
                <div className="doc">
                  {docLabel(x, lang)} — {dict.dueOn} {fmtDate(x.dueDate, dict.locale)}
                </div>
                <div className="due">{due}</div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
