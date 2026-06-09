import { DeleteButton } from "@/components/delete-button";
import { Pill } from "@/components/pill";
import { docLabel, getDeadlines, getDocTypeMap, getVehicles, VEHICLE_DOC_COLS } from "@/lib/deadlines";
import { getLang, t } from "@/lib/i18n";

export default async function VehiclesPage() {
  const lang = await getLang();
  const dict = t(lang);
  const [vehicles, deadlines, docTypes] = await Promise.all([
    getVehicles(),
    getDeadlines(),
    getDocTypeMap(),
  ]);
  const byDoc = new Map(deadlines.map((d) => [d.id, d]));

  return (
    <>
      <div className="sec-head">
        <h2>{dict.vehiclesTitle}</h2>
        <span className="count">{dict.vehiclesCount(vehicles.length)}</span>
      </div>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>{dict.colVehicle}</th>
              {VEHICLE_DOC_COLS.map((key) => {
                const info = docTypes.get(key);
                return <th key={key}>{info ? docLabel(info, lang) : key}</th>;
              })}
              <th aria-label={dict.del} />
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className="name-cell">
                  <span className="plate">{v.plate}</span>
                  {v.model ? <div className="meta">{v.model}</div> : null}
                </td>
                {VEHICLE_DOC_COLS.map((key) => {
                  const doc = v.documents.find((x) => x.docTypeKey === key);
                  const row = doc ? byDoc.get(doc.id) : undefined;
                  const mode = docTypes.get(key)?.mode ?? "expiry";
                  return (
                    <td key={key}>
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
                  <DeleteButton id={v.id} kind="vehicle" confirmText={dict.confirmDel} title={dict.del} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">{dict.vehicleNote}</p>
    </>
  );
}
