import Link from "next/link";
import { notFound } from "next/navigation";
import { AiDeleteButton } from "@/components/ai-delete-button";
import { setObligationStatus } from "@/app/dashboard/ai-act/actions";
import {
  AI_DEADLINE_ISO,
  getAiSummary,
  getAiSystem,
  obligationTitle,
  riskLabel,
  riskStatus,
} from "@/lib/ai-act";
import { fmtDate } from "@/lib/format";
import { getLang, t } from "@/lib/i18n";

const STATUSES = ["todo", "in_progress", "done"] as const;

export default async function AiSystemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const dict = t(lang);
  const [system, summary] = await Promise.all([getAiSystem(id), getAiSummary()]);
  if (!system) notFound();

  const status = system.riskLevel ? riskStatus(system.riskLevel) : "none";
  const statusLabels: Record<(typeof STATUSES)[number], string> = {
    todo: dict.aiStatusTodo,
    in_progress: dict.aiStatusInProgress,
    done: dict.aiStatusDone,
  };
  const provider =
    system.provider === "third_party"
      ? `${dict.aiProviderThirdParty}${system.thirdPartyName ? ` · ${system.thirdPartyName}` : ""}`
      : dict.aiProviderInternal;

  return (
    <>
      <div className="sec-head">
        <Link href="/dashboard/ai-act" className="count" style={{ textDecoration: "none" }}>
          {dict.aiBackToList}
        </Link>
      </div>

      {/* ── Sınıflandırma sonucu ── */}
      <div className="panel" style={{ padding: 22, marginBottom: 18 }}>
        <div className="ai-result-head">
          <h2 style={{ margin: 0 }}>{system.name}</h2>
          <span className={`risk-badge ${status} lg`}>{riskLabel(system.riskLevel, dict)}</span>
        </div>
        <p className="meta" style={{ marginTop: 6 }}>{system.purpose}</p>

        {system.riskLevel === "prohibited" ? (
          <div className="login-error" style={{ marginTop: 12 }}>{dict.aiProhibitedWarn}</div>
        ) : null}

        <dl className="ai-dl">
          <div>
            <dt>{dict.aiColProvider}</dt>
            <dd>{provider}</dd>
          </div>
          <div>
            <dt>{dict.aiPersonalData}</dt>
            <dd>{system.processesPersonalData ? dict.aiYes : dict.aiNo}</dd>
          </div>
          {system.rationale ? (
            <div>
              <dt>{dict.aiRationale}</dt>
              <dd>{system.rationale}</dd>
            </div>
          ) : null}
          {system.rulesetVersion ? (
            <div>
              <dt>{dict.aiRuleset}</dt>
              <dd>{system.rulesetVersion}</dd>
            </div>
          ) : null}
          {system.classifiedAt ? (
            <div>
              <dt>{dict.aiClassifiedAt}</dt>
              <dd>{fmtDate(system.classifiedAt, dict.locale)}</dd>
            </div>
          ) : null}
        </dl>

        {system.riskLevel === "high" ? (
          <div className={`ai-deadline ${summary.daysToDeadline < 0 ? "bad" : "warn"}`}>
            ◷ {dict.aiDeadlineNote(summary.daysToDeadline)} ({fmtDate(new Date(`${AI_DEADLINE_ISO}T00:00:00Z`), dict.locale)})
          </div>
        ) : null}
      </div>

      {/* ── Yükümlülük kontrol listesi ── */}
      <div className="sec-head">
        <h2>{dict.aiObligationsTitle}</h2>
      </div>
      <div className="panel">
        {system.obligations.length === 0 ? (
          <div className="empty">{dict.aiNoObligations}</div>
        ) : (
          system.obligations.map((o) => (
            <div key={o.id} className={`oblig-row ${o.status}`}>
              <span className="oblig-dot" />
              <span className="oblig-title">{obligationTitle(o, lang)}</span>
              <form action={setObligationStatus} className="oblig-toggle">
                <input type="hidden" name="id" value={o.id} />
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    type="submit"
                    name="status"
                    value={st}
                    className={`oblig-st${o.status === st ? " active" : ""} ${st}`}
                  >
                    {statusLabels[st]}
                  </button>
                ))}
              </form>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <AiDeleteButton id={system.id} confirmText={dict.confirmDel} title={dict.del} />
      </div>
    </>
  );
}
