import { DeleteButton } from "@/components/delete-button";
import { Pill } from "@/components/pill";
import { docLabel, DRIVER_DOC_COLS, getDeadlines, getDocTypeMap, getDrivers } from "@/lib/deadlines";
import { getLang, t } from "@/lib/i18n";

export default async function DriversPage() {
  const lang = await getLang();
  const dict = t(lang);
  const [drivers, deadlines, docTypes] = await Promise.all([
    getDrivers(),
    getDeadlines(),
    getDocTypeMap(),
  ]);
  const byDoc = new Map(deadlines.map((d) => [d.id, d]));

  return (
    <>
      <div className="sec-head">
        <h2>{dict.driversTitle}</h2>
        <span className="count">{dict.driversCount(drivers.length)}</span>
      </div>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>{dict.colDriver}</th>
              {DRIVER_DOC_COLS.map((key) => {
                const info = docTypes.get(key);
                return (
                  <th key={key} className={key === "aerztliche_u" ? "hide-sm" : undefined}>
                    {info ? docLabel(info, lang) : key}
                  </th>
                );
              })}
              <th aria-label={dict.del} />
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td className="name-cell">
                  {d.name}
                  {d.employeeNo ? <div className="meta">{d.employeeNo}</div> : null}
                </td>
                {DRIVER_DOC_COLS.map((key) => {
                  const doc = d.documents.find((x) => x.docTypeKey === key);
                  const row = doc ? byDoc.get(doc.id) : undefined;
                  const mode = docTypes.get(key)?.mode ?? "expiry";
                  return (
                    <td key={key} className={key === "aerztliche_u" ? "hide-sm" : undefined}>
                      <Pill
                        status={row?.status ?? "none"}
                        daysLeft={row?.daysLeft ?? null}
                        mode={mode}
                        dueDate={row?.dueDate}
                        dict={dict}
                        locale={dict.locale}
                      />
                    </td>
                  );
                })}
                <td>
                  <DeleteButton id={d.id} kind="driver" confirmText={dict.confirmDel} title={dict.del} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">{dict.driverNote}</p>
    </>
  );
}
