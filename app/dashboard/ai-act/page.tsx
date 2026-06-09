import Link from "next/link";
import { getAiSystems, riskLabel, riskStatus } from "@/lib/ai-act";
import { getLang, t } from "@/lib/i18n";

export default async function AiActPage() {
  const lang = await getLang();
  const dict = t(lang);
  const systems = await getAiSystems();

  return (
    <>
      <div className="sec-head">
        <h2>{dict.aiTitle}</h2>
        <span className="count">{dict.aiCount(systems.length)}</span>
        <Link href="/dashboard/ai-act/new" className="addbtn" style={{ marginLeft: "auto" }}>
          {dict.aiAddSystem}
        </Link>
      </div>
      <div className="panel">
        {systems.length === 0 ? (
          <div className="empty">{dict.aiEmpty}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{dict.aiColSystem}</th>
                <th>{dict.aiColRisk}</th>
                <th className="hide-sm">{dict.aiColProvider}</th>
                <th>{dict.aiColObligations}</th>
              </tr>
            </thead>
            <tbody>
              {systems.map((s) => {
                const status = s.riskLevel ? riskStatus(s.riskLevel) : "none";
                const provider =
                  s.provider === "third_party"
                    ? `${dict.aiProviderThirdParty}${s.thirdPartyName ? ` · ${s.thirdPartyName}` : ""}`
                    : dict.aiProviderInternal;
                return (
                  <tr key={s.id}>
                    <td className="name-cell">
                      <Link href={`/dashboard/ai-act/${s.id}`} className="rowlink">
                        {s.name}
                      </Link>
                      <div className="meta">{s.purpose}</div>
                    </td>
                    <td>
                      <span className={`risk-badge ${status}`}>{riskLabel(s.riskLevel, dict)}</span>
                    </td>
                    <td className="hide-sm">{provider}</td>
                    <td>
                      {s.obligationsTotal > 0 ? (
                        <span className="oblig-prog">
                          {s.obligationsDone}/{s.obligationsTotal}
                        </span>
                      ) : (
                        <span className="meta">{dict.none}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
