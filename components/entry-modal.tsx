"use client";

import { useActionState, useEffect, useState } from "react";
import { createDriver, createVehicle, type EntryState } from "@/app/dashboard/actions";

type Field = { key: string; label: string; mode: string };

export type EntryLabels = {
  addEntry: string;
  newDriver: string;
  newVehicle: string;
  driver: string;
  vehicle: string;
  name: string;
  employeeNo: string;
  plate: string;
  model: string;
  save: string;
  cancel: string;
  errName: string;
  errPlate: string;
  until: string;
  last: string;
};

function dateLabel(f: Field, labels: EntryLabels) {
  return f.mode === "interval" ? `${f.label} (${labels.last})` : `${f.label} ${labels.until}`;
}

export function EntryModal({
  driverFields,
  vehicleFields,
  labels,
}: {
  driverFields: Field[];
  vehicleFields: Field[];
  labels: EntryLabels;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"driver" | "vehicle">("driver");
  const [drvState, drvAction, drvPending] = useActionState<EntryState, FormData>(createDriver, {});
  const [vehState, vehAction, vehPending] = useActionState<EntryState, FormData>(createVehicle, {});

  useEffect(() => {
    if (drvState.ok || vehState.ok) setOpen(false);
  }, [drvState, vehState]);

  return (
    <>
      <button type="button" className="addbtn" onClick={() => setOpen(true)}>
        {labels.addEntry}
      </button>
      {open ? (
        <div
          className="overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal">
            <div className="mh">
              <h3>{tab === "driver" ? labels.newDriver : labels.newVehicle}</h3>
              <button type="button" className="x" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <div className="mb">
              <div className="tabs">
                <button
                  type="button"
                  className={`mbtn${tab === "driver" ? " primary" : ""}`}
                  onClick={() => setTab("driver")}
                >
                  {labels.driver}
                </button>
                <button
                  type="button"
                  className={`mbtn${tab === "vehicle" ? " primary" : ""}`}
                  onClick={() => setTab("vehicle")}
                >
                  {labels.vehicle}
                </button>
              </div>

              {tab === "driver" ? (
                <form action={drvAction}>
                  {drvState.error === "name" ? <div className="login-error">{labels.errName}</div> : null}
                  <div className="fld">
                    <label>{labels.name}</label>
                    <input name="name" placeholder="z. B. Murat Öztürk" />
                  </div>
                  <div className="fld">
                    <label>{labels.employeeNo}</label>
                    <input name="employeeNo" />
                  </div>
                  <div className="frow">
                    {driverFields.map((f) => (
                      <div className="fld" key={f.key}>
                        <label>{dateLabel(f, labels)}</label>
                        <input type="date" name={`dt_${f.key}`} />
                      </div>
                    ))}
                  </div>
                  <div className="mf">
                    <button type="button" className="mbtn" onClick={() => setOpen(false)}>
                      {labels.cancel}
                    </button>
                    <button type="submit" className="mbtn primary" disabled={drvPending}>
                      {labels.save}
                    </button>
                  </div>
                </form>
              ) : (
                <form action={vehAction}>
                  {vehState.error === "plate" ? <div className="login-error">{labels.errPlate}</div> : null}
                  <div className="frow">
                    <div className="fld">
                      <label>{labels.plate}</label>
                      <input name="plate" placeholder="B-DL 505" />
                    </div>
                    <div className="fld">
                      <label>{labels.model}</label>
                      <input name="model" placeholder="Mercedes Actros" />
                    </div>
                  </div>
                  <div className="frow">
                    {vehicleFields.map((f) => (
                      <div className="fld" key={f.key}>
                        <label>{dateLabel(f, labels)}</label>
                        <input type="date" name={`dt_${f.key}`} />
                      </div>
                    ))}
                  </div>
                  <div className="mf">
                    <button type="button" className="mbtn" onClick={() => setOpen(false)}>
                      {labels.cancel}
                    </button>
                    <button type="submit" className="mbtn primary" disabled={vehPending}>
                      {labels.save}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
