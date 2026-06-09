// Veri erişim katmanı. Vadeleri `v_deadlines` görünümünden, yapıyı `driver`/`vehicle`
// tablolarından çeker. Durum eşiği plana göre tektir (§3): <0 kırmızı, ≤45 sarı, diğeri yeşil.
import { prisma } from "./db";
import type { Lang } from "./i18n";

export type Status = "ok" | "warn" | "bad" | "none";

export const WARN_DAYS = 45;

// Tablolardaki belge sütunlarının sırası (demo düzeniyle aynı).
export const DRIVER_DOC_COLS = [
  "fuehrerschein", "fahrerkarte", "modul95", "adr", "aerztliche_u", "fahrerkarte_dl",
] as const;
export const VEHICLE_DOC_COLS = [
  "hu_tuev", "uvv_sp", "tacho_kalibrierung", "massenspeicher_dl",
] as const;

export function statusFromDays(daysLeft: number | null): Status {
  if (daysLeft === null) return "none";
  if (daysLeft < 0) return "bad";
  if (daysLeft <= WARN_DAYS) return "warn";
  return "ok";
}

export type DeadlineRow = {
  id: string; // document.id
  key: string;
  labelDe: string;
  labelTr: string;
  appliesTo: "driver" | "vehicle" | "ai_system";
  mode: string;
  subject: string; // sürücü adı, plaka veya AI sistem adı
  meta: string; // araçlar için model
  due: string; // YYYY-MM-DD
  dueDate: Date;
  daysLeft: number;
  status: Status;
};

type RawRow = {
  id: string;
  key: string;
  label_de: string;
  label_tr: string;
  applies_to: "driver" | "vehicle" | "ai_system";
  mode: string;
  subject: string;
  due: string;
  days_left: number;
};

export function docLabel(row: { labelDe: string; labelTr: string }, lang: Lang): string {
  return lang === "tr" ? row.labelTr : row.labelDe;
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Tüm vadeler — `v_deadlines` görünümünden, gün farkı PostgreSQL'de hesaplanır. */
export async function getDeadlines(): Promise<DeadlineRow[]> {
  const [rows, vehicles] = await Promise.all([
    prisma.$queryRaw<RawRow[]>`
      SELECT id::text AS id, key, label_de, label_tr, applies_to, mode, subject,
             to_char(due_date, 'YYYY-MM-DD') AS due,
             (due_date - CURRENT_DATE)::int AS days_left
      FROM v_deadlines
      WHERE due_date IS NOT NULL
      ORDER BY due_date ASC`,
    prisma.vehicle.findMany({
      select: { model: true, plate: true, documents: { select: { id: true } } },
    }),
  ]);

  const modelByDoc = new Map<string, string>();
  for (const v of vehicles) {
    for (const d of v.documents) modelByDoc.set(d.id, v.model ?? v.plate);
  }

  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    labelDe: r.label_de,
    labelTr: r.label_tr,
    appliesTo: r.applies_to,
    mode: r.mode,
    subject: r.subject,
    meta: r.applies_to === "vehicle" ? modelByDoc.get(r.id) ?? "" : "",
    due: r.due,
    dueDate: parseISO(r.due),
    daysLeft: Number(r.days_left),
    status: statusFromDays(Number(r.days_left)),
  }));
}

export type DriverWithDocs = {
  id: string;
  name: string;
  employeeNo: string | null;
  documents: { id: string; docTypeKey: string }[];
};
export type VehicleWithDocs = {
  id: string;
  plate: string;
  model: string | null;
  documents: { id: string; docTypeKey: string }[];
};

export function getDrivers(): Promise<DriverWithDocs[]> {
  return prisma.driver.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, employeeNo: true, documents: { select: { id: true, docTypeKey: true } } },
  });
}

export function getVehicles(): Promise<VehicleWithDocs[]> {
  return prisma.vehicle.findMany({
    where: { active: true },
    orderBy: { plate: "asc" },
    select: { id: true, plate: true, model: true, documents: { select: { id: true, docTypeKey: true } } },
  });
}

export type DocTypeInfo = { key: string; labelDe: string; labelTr: string; mode: string; intervalDays: number | null };

export async function getDocTypeMap(): Promise<Map<string, DocTypeInfo>> {
  const types = await prisma.docType.findMany();
  return new Map(types.map((t) => [t.key, t]));
}

export type DocField = { key: string; label: string; mode: string };

/** Ekleme formu için sıralı (demo düzeni) belge alanları, dile göre etiketli. */
export async function getDocFields(appliesTo: "driver" | "vehicle", lang: Lang): Promise<DocField[]> {
  const order = appliesTo === "driver" ? DRIVER_DOC_COLS : VEHICLE_DOC_COLS;
  const map = await getDocTypeMap();
  return order.map((k) => {
    const info = map.get(k);
    return { key: k, label: info ? docLabel(info, lang) : k, mode: info?.mode ?? "expiry" };
  });
}

export async function getCounts(): Promise<{ drivers: number; vehicles: number }> {
  const [drivers, vehicles] = await Promise.all([
    prisma.driver.count({ where: { active: true } }),
    prisma.vehicle.count({ where: { active: true } }),
  ]);
  return { drivers, vehicles };
}
