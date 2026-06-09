"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type EntryState = { error?: "name" | "plate" | "auth"; ok?: boolean };

function toDate(value: FormDataEntryValue | null): Date | null {
  const s = String(value ?? "").trim();
  return s ? new Date(`${s}T00:00:00.000Z`) : null;
}

// Form'daki tarih alanlarından (dt_<key>) belge create kayıtları üretir.
async function buildDocs(appliesTo: "driver" | "vehicle", formData: FormData) {
  const docTypes = await prisma.docType.findMany({ where: { appliesTo } });
  const docs: { docTypeKey: string; validUntil: Date | null; lastAction: Date | null }[] = [];
  for (const dt of docTypes) {
    const d = toDate(formData.get(`dt_${dt.key}`));
    if (!d) continue;
    docs.push({
      docTypeKey: dt.key,
      validUntil: dt.mode === "expiry" ? d : null,
      lastAction: dt.mode === "interval" ? d : null,
    });
  }
  return docs;
}

export async function createDriver(_prev: EntryState, formData: FormData): Promise<EntryState> {
  if (!(await getSession())) return { error: "auth" };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "name" };
  const employeeNo = String(formData.get("employeeNo") ?? "").trim() || null;
  const docs = await buildDocs("driver", formData);

  await prisma.driver.create({
    data: { name, employeeNo, documents: { create: docs } },
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function createVehicle(_prev: EntryState, formData: FormData): Promise<EntryState> {
  if (!(await getSession())) return { error: "auth" };
  const plate = String(formData.get("plate") ?? "").trim();
  if (!plate) return { error: "plate" };
  const model = String(formData.get("model") ?? "").trim() || null;
  const docs = await buildDocs("vehicle", formData);

  await prisma.vehicle.create({
    data: { plate, model, documents: { create: docs } },
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteDriver(formData: FormData): Promise<void> {
  if (!(await getSession())) return;
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.driver.delete({ where: { id } });
  revalidatePath("/dashboard", "layout");
}

export async function deleteVehicle(formData: FormData): Promise<void> {
  if (!(await getSession())) return;
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.vehicle.delete({ where: { id } });
  revalidatePath("/dashboard", "layout");
}
