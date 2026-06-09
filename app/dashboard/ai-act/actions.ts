"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { classify, getActiveRuleset } from "@/lib/ai-act";
import { prisma } from "@/lib/db";

export type AiEntryState = { error?: "name" | "purpose" | "auth" | "noRuleset" };

const OBLIGATION_STATUSES = ["todo", "in_progress", "done"] as const;
type ObligationStatus = (typeof OBLIGATION_STATUSES)[number];

/**
 * Rehberli anketten sistem oluşturur: cevapları karar ağacında değerlendirir,
 * sınıflandırmayı kaydeder ve (yüksek risk ise) aktif kural setinin şablonlarından
 * yükümlülükleri üretir. Sonuç ekranı için sistem detayına yönlendirir.
 */
export async function createAiSystem(_prev: AiEntryState, formData: FormData): Promise<AiEntryState> {
  if (!(await getSession())) return { error: "auth" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "name" };
  const purpose = String(formData.get("purpose") ?? "").trim();
  if (!purpose) return { error: "purpose" };

  const ruleset = await getActiveRuleset();
  if (!ruleset) return { error: "noRuleset" };

  const provider = formData.get("provider") === "third_party" ? "third_party" : "internal";
  const thirdPartyName =
    provider === "third_party" ? String(formData.get("thirdPartyName") ?? "").trim() || null : null;
  const processesPersonalData = formData.get("processesPersonalData") === "on";

  // Anket cevapları: her kural kodu için "yes" → true.
  const answers: Record<string, boolean> = {};
  for (const rule of ruleset.rules) {
    answers[rule.code] = formData.get(`answer_${rule.code}`) === "yes";
  }
  const result = classify(ruleset, answers);

  // Yüksek risk → şablonlardan yükümlülük üret.
  const templates =
    result.riskLevel === "high"
      ? await prisma.aiObligationTemplate.findMany({
          where: { rulesetVersion: ruleset.version, riskLevelTrigger: "high" },
          orderBy: { key: "asc" },
        })
      : [];

  const system = await prisma.aiSystem.create({
    data: {
      name,
      purpose,
      provider,
      thirdPartyName,
      processesPersonalData,
      classifications: {
        create: {
          riskLevel: result.riskLevel,
          rationale: result.rationale,
          rulesetVersion: result.rulesetVersion,
        },
      },
      obligations: {
        create: templates.map((t) => ({
          key: t.key,
          titleDe: t.titleDe,
          titleTr: t.titleTr,
          riskLevelTrigger: t.riskLevelTrigger,
        })),
      },
    },
  });

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/ai-act/${system.id}`);
}

/** Yükümlülük durumunu değiştirir (kontrol listesi toggle). */
export async function setObligationStatus(formData: FormData): Promise<void> {
  if (!(await getSession())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !OBLIGATION_STATUSES.includes(status as ObligationStatus)) return;

  await prisma.aiObligation.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard", "layout");
}

export async function deleteAiSystem(formData: FormData): Promise<void> {
  if (!(await getSession())) return;
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.aiSystem.delete({ where: { id } });
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/ai-act");
}
