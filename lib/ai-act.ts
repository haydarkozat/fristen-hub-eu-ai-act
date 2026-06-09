// EU AI Act (KI-Verordnung) veri erişim ve iş mantığı katmanı.
// Sınıflandırma kuralları ve yükümlülük kataloğu KODA GÖMÜLMEZ; aktif `ai_ruleset`
// sürümünün `ai_risk_rule` / `ai_obligation_template` satırlarından okunur (doc_type deseni).
import { prisma } from "./db";
import type { Dict, Lang } from "./i18n";

export type RiskLevel = "prohibited" | "high" | "limited" | "minimal";

/** Risk seviyesinin yerelleştirilmiş etiketi (sınıflandırılmamış → riskUnknown). */
export function riskLabel(level: RiskLevel | null, dict: Dict): string {
  switch (level) {
    case "prohibited": return dict.riskProhibited;
    case "high": return dict.riskHigh;
    case "limited": return dict.riskLimited;
    case "minimal": return dict.riskMinimal;
    default: return dict.riskUnknown;
  }
}

// Yüksek riskli sistemler için AI Act yükümlülüklerinin uygulanma son tarihi.
export const AI_DEADLINE_ISO = "2026-08-02";

// Risk seviyesi → durum rengi (mevcut ok/warn/bad token'larıyla hizalı).
export function riskStatus(level: RiskLevel): "ok" | "warn" | "bad" {
  if (level === "prohibited" || level === "high") return "bad";
  if (level === "limited") return "warn";
  return "ok";
}

export const RISK_ORDER: Record<RiskLevel, number> = {
  prohibited: 0,
  high: 1,
  limited: 2,
  minimal: 3,
};

// ── Aktif kural seti & sınıflandırma anketi ──────────────────────────────────

export type RiskRule = {
  ord: number;
  code: string;
  questionDe: string;
  questionTr: string;
  helpDe: string;
  helpTr: string;
  resultRiskLevel: RiskLevel;
};

export type ActiveRuleset = {
  version: string;
  labelDe: string;
  labelTr: string;
  rules: RiskRule[]; // ord ASC
};

/** En güncel aktif kural seti; yoksa null. Birden çok aktif varsa en yeni yürürlük tarihli. */
export async function getActiveRuleset(): Promise<ActiveRuleset | null> {
  const rs = await prisma.aiRuleset.findFirst({
    where: { active: true },
    orderBy: { effectiveFrom: "desc" },
    include: { rules: { orderBy: { ord: "asc" } } },
  });
  if (!rs) return null;
  return {
    version: rs.version,
    labelDe: rs.labelDe,
    labelTr: rs.labelTr,
    rules: rs.rules.map((r) => ({
      ord: r.ord,
      code: r.code,
      questionDe: r.questionDe,
      questionTr: r.questionTr,
      helpDe: r.helpDe,
      helpTr: r.helpTr,
      resultRiskLevel: r.resultRiskLevel as RiskLevel,
    })),
  };
}

export type ClassificationResult = {
  riskLevel: RiskLevel;
  rationale: string; // insan-okur gerekçe (DE — yasal/iş dili)
  rulesetVersion: string;
  matchedCode: string | null; // tetikleyen kural; minimal ise null
};

/**
 * Karar ağacı: kuralları ord sırasıyla gez, "evet" denen İLK kuralın seviyesini ata.
 * Hiçbiri değilse → minimal. Kurallar tamamen aktif kural setinden gelir.
 */
export function classify(ruleset: ActiveRuleset, answers: Record<string, boolean>): ClassificationResult {
  for (const rule of ruleset.rules) {
    if (answers[rule.code]) {
      return {
        riskLevel: rule.resultRiskLevel,
        rationale: rule.questionDe,
        rulesetVersion: ruleset.version,
        matchedCode: rule.code,
      };
    }
  }
  return {
    riskLevel: "minimal",
    rationale: "Kein Verbots-, Hochrisiko- oder Transparenzkriterium erfüllt → minimales Risiko.",
    rulesetVersion: ruleset.version,
    matchedCode: null,
  };
}

// ── Sistem listesi & detay ───────────────────────────────────────────────────

export type AiSystemRow = {
  id: string;
  name: string;
  purpose: string;
  provider: "internal" | "third_party";
  thirdPartyName: string | null;
  processesPersonalData: boolean;
  riskLevel: RiskLevel | null; // en güncel sınıflandırma
  obligationsTotal: number;
  obligationsDone: number;
};

/** Tüm AI sistemleri — en güncel sınıflandırma + yükümlülük ilerlemesiyle. */
export async function getAiSystems(): Promise<AiSystemRow[]> {
  const systems = await prisma.aiSystem.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      classifications: { orderBy: { classifiedAt: "desc" }, take: 1 },
      obligations: { select: { status: true } },
    },
  });
  return systems.map((s) => ({
    id: s.id,
    name: s.name,
    purpose: s.purpose,
    provider: s.provider as "internal" | "third_party",
    thirdPartyName: s.thirdPartyName,
    processesPersonalData: s.processesPersonalData,
    riskLevel: (s.classifications[0]?.riskLevel as RiskLevel | undefined) ?? null,
    obligationsTotal: s.obligations.length,
    obligationsDone: s.obligations.filter((o) => o.status === "done").length,
  }));
}

export type ObligationRow = {
  id: string;
  key: string;
  titleDe: string;
  titleTr: string;
  status: "todo" | "in_progress" | "done";
};

export type AiSystemDetail = {
  id: string;
  name: string;
  purpose: string;
  provider: "internal" | "third_party";
  thirdPartyName: string | null;
  processesPersonalData: boolean;
  riskLevel: RiskLevel | null;
  rationale: string | null;
  rulesetVersion: string | null;
  classifiedAt: Date | null;
  obligations: ObligationRow[];
};

export async function getAiSystem(id: string): Promise<AiSystemDetail | null> {
  const s = await prisma.aiSystem.findUnique({
    where: { id },
    include: {
      classifications: { orderBy: { classifiedAt: "desc" }, take: 1 },
      obligations: { orderBy: { key: "asc" } },
    },
  });
  if (!s) return null;
  const c = s.classifications[0];
  return {
    id: s.id,
    name: s.name,
    purpose: s.purpose,
    provider: s.provider as "internal" | "third_party",
    thirdPartyName: s.thirdPartyName,
    processesPersonalData: s.processesPersonalData,
    riskLevel: (c?.riskLevel as RiskLevel | undefined) ?? null,
    rationale: c?.rationale ?? null,
    rulesetVersion: c?.rulesetVersion ?? null,
    classifiedAt: c?.classifiedAt ?? null,
    obligations: s.obligations.map((o) => ({
      id: o.id,
      key: o.key,
      titleDe: o.titleDe,
      titleTr: o.titleTr,
      status: o.status as "todo" | "in_progress" | "done",
    })),
  };
}

export function obligationTitle(o: { titleDe: string; titleTr: string }, lang: Lang): string {
  return lang === "tr" ? o.titleTr : o.titleDe;
}

// ── Dashboard özeti ──────────────────────────────────────────────────────────

export type AiSummary = {
  total: number;
  byRisk: Record<RiskLevel, number>;
  highRisk: number;
  daysToDeadline: number; // 2026-08-02'ye kalan gün (geçmişse negatif)
  deadlineISO: string;
};

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

/** Sidebar rozeti için AI sistem sayısı. */
export function getAiCount(): Promise<number> {
  return prisma.aiSystem.count();
}

export async function getAiSummary(): Promise<AiSummary> {
  const systems = await getAiSystems();
  const byRisk: Record<RiskLevel, number> = { prohibited: 0, high: 0, limited: 0, minimal: 0 };
  for (const s of systems) {
    if (s.riskLevel) byRisk[s.riskLevel] += 1;
  }
  return {
    total: systems.length,
    byRisk,
    highRisk: byRisk.high,
    daysToDeadline: daysUntil(AI_DEADLINE_ISO),
    deadlineISO: AI_DEADLINE_ISO,
  };
}
