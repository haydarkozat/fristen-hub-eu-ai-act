// Fristen-Hub — örnek seed verisi.
// Plandaki (fristen-hub-teknik-plan.md §2) doc_type listesini ve gerçekçi bir vade
// dağılımını (kırmızı / sarı / yeşil, hem expiry hem interval) oluşturur.
// Idempotent: tekrar çalıştırıldığında veriyi temizleyip yeniden kurar.
import "dotenv/config"; // tsx .env'i otomatik yüklemez
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Bugüne göreli, UTC öğlen sabitli tarih (timezone kaymasını önler).
const today = new Date();
function dateOffset(days: number): Date {
  return new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + days,
      12,
    ),
  );
}

// Plan §2 — belge türü tanımları.
const DOC_TYPES = [
  { key: "fuehrerschein", appliesTo: "driver", mode: "expiry", intervalDays: null, labelDe: "Führerschein", labelTr: "Ehliyet" },
  { key: "fahrerkarte", appliesTo: "driver", mode: "expiry", intervalDays: null, labelDe: "Fahrerkarte", labelTr: "Sürücü Kartı" },
  { key: "modul95", appliesTo: "driver", mode: "expiry", intervalDays: null, labelDe: "Modul 95 (BKrFQG)", labelTr: "Modül 95 (BKrFQG)" },
  { key: "adr", appliesTo: "driver", mode: "expiry", intervalDays: null, labelDe: "ADR-Schein", labelTr: "ADR Belgesi" },
  { key: "aerztliche_u", appliesTo: "driver", mode: "expiry", intervalDays: null, labelDe: "Ärztl. Untersuchung", labelTr: "Sağlık Muayenesi" },
  { key: "fahrerkarte_dl", appliesTo: "driver", mode: "interval", intervalDays: 28, labelDe: "Fahrerkarte auslesen", labelTr: "Sürücü kartını oku" },
  { key: "hu_tuev", appliesTo: "vehicle", mode: "expiry", intervalDays: null, labelDe: "HU / TÜV", labelTr: "Muayene (HU/TÜV)" },
  { key: "uvv_sp", appliesTo: "vehicle", mode: "expiry", intervalDays: null, labelDe: "UVV / Sicherheitsprüfung", labelTr: "UVV / Güvenlik Kontrolü" },
  { key: "tacho_kalibrierung", appliesTo: "vehicle", mode: "expiry", intervalDays: null, labelDe: "Tachograph-Kalibrierung", labelTr: "Takograf Kalibrasyonu" },
  { key: "massenspeicher_dl", appliesTo: "vehicle", mode: "interval", intervalDays: 90, labelDe: "Massenspeicher auslesen", labelTr: "Kütle belleğini oku" },
];

// ── EU AI Act referans verisi (versiyonlanabilir; koda gömülmez) ──────────────
const AI_RULESET_VERSION = "2024-1689-v1";

// Sınıflandırma karar ağacı — ord sırasıyla; ilk "evet" kazanır, hiçbiri → minimal.
const AI_RISK_RULES = [
  {
    ord: 1,
    code: "prohibited",
    resultRiskLevel: "prohibited",
    questionDe: "Setzt das System verbotene Praktiken ein (Social Scoring, manipulative oder biometrische Verhaltensbeeinflussung)?",
    questionTr: "Sistem yasaklı uygulamalar mı içeriyor (sosyal puanlama, manipülatif veya biyometrik davranış yönlendirme)?",
    helpDe: "Art. 5 KI-VO — z. B. Social Scoring, unterschwellige Manipulation, Emotionserkennung am Arbeitsplatz.",
    helpTr: "AI Act Md. 5 — ör. sosyal puanlama, bilinçaltı manipülasyon, işyerinde duygu tanıma.",
  },
  {
    ord: 2,
    code: "annex_iii",
    resultRiskLevel: "high",
    questionDe: "Fällt die Nutzung in einen Hochrisikobereich nach Anhang III (Personalauswahl/HR, Kredit-/Versicherungsscoring, kritische Infrastruktur, biometrische Identifizierung)?",
    questionTr: "Kullanım Annex III yüksek-risk alanına mı giriyor (işe alım/İK, kredi/sigorta skorlama, kritik altyapı, biyometrik tanımlama)?",
    helpDe: "Anhang III KI-VO — Hochrisiko-Anwendungsfälle mit umfangreichen Pflichten ab 02.08.2026.",
    helpTr: "AI Act Annex III — 02.08.2026 itibarıyla kapsamlı yükümlülükleri olan yüksek-risk kullanım alanları.",
  },
  {
    ord: 3,
    code: "transparency",
    resultRiskLevel: "limited",
    questionDe: "Interagiert das System mit Menschen oder erzeugt es Inhalte (Chatbot, Deepfake, generative KI)?",
    questionTr: "Sistem insanlarla mı etkileşiyor ya da içerik mi üretiyor (chatbot, deepfake, üretken yapay zekâ)?",
    helpDe: "Art. 50 KI-VO — Transparenzpflicht: Nutzer müssen wissen, dass sie mit einer KI interagieren bzw. dass Inhalte KI-generiert sind.",
    helpTr: "AI Act Md. 50 — şeffaflık: kullanıcılar bir yapay zekâ ile etkileştiğini / içeriğin YZ üretimi olduğunu bilmelidir.",
  },
];

// Yüksek riskli sistemler için otomatik üretilecek yükümlülük kataloğu (Kapitel III, Abschnitt 2).
const AI_OBLIGATION_TEMPLATES = [
  { key: "risk_management", riskLevelTrigger: "high", titleDe: "Risikomanagementsystem", titleTr: "Risk yönetim sistemi" },
  { key: "data_governance", riskLevelTrigger: "high", titleDe: "Daten-Governance & Datenqualität", titleTr: "Veri yönetişimi ve veri kalitesi" },
  { key: "technical_documentation", riskLevelTrigger: "high", titleDe: "Technische Dokumentation", titleTr: "Teknik dokümantasyon" },
  { key: "record_keeping", riskLevelTrigger: "high", titleDe: "Protokollierung (Logging)", titleTr: "Kayıt tutma (loglama)" },
  { key: "transparency", riskLevelTrigger: "high", titleDe: "Transparenz & Information der Betreiber", titleTr: "Şeffaflık ve kullanıcı bilgilendirme" },
  { key: "human_oversight", riskLevelTrigger: "high", titleDe: "Menschliche Aufsicht", titleTr: "İnsan gözetimi" },
  { key: "accuracy_robustness_security", riskLevelTrigger: "high", titleDe: "Genauigkeit, Robustheit & Cybersicherheit", titleTr: "Doğruluk, sağlamlık ve siber güvenlik" },
];

async function main() {
  // --- Temizlik (idempotentlik). document -> notification_log cascade ile silinir. ---
  await prisma.document.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  // ai_system -> ai_classification + ai_obligation cascade ile silinir.
  await prisma.aiSystem.deleteMany();

  // --- doc_type (upsert: kalıcı referans veri) ---
  for (const dt of DOC_TYPES) {
    await prisma.docType.upsert({
      where: { key: dt.key },
      create: dt,
      update: dt,
    });
  }

  // --- admin kullanıcı (parola bcrypt ile hash'lenir; plan §5) ---
  // Demo kimlik bilgileri .env'den okunur; varsayılanlar yalnız yerel demo içindir.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Demo Admin";
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "demo1234", 10);
  await prisma.appUser.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "admin",
      lang: "de",
    },
    update: { passwordHash, name: adminName, role: "admin" },
  });

  // --- Sürücüler ---
  const mehmet = await prisma.driver.create({ data: { name: "Mehmet Yılmaz", employeeNo: "F-1001" } });
  const stefan = await prisma.driver.create({ data: { name: "Stefan Bauer", employeeNo: "F-1002" } });
  const ali = await prisma.driver.create({ data: { name: "Ali Demir", employeeNo: "F-1003" } });

  // --- Araçlar ---
  const v1 = await prisma.vehicle.create({ data: { plate: "B-DL 1234", model: "MAN TGX", vin: "WMA06XZZ1AM000001" } });
  const v2 = await prisma.vehicle.create({ data: { plate: "B-DL 5678", model: "Mercedes Actros", vin: "WDB96340310000002" } });
  const v3 = await prisma.vehicle.create({ data: { plate: "M-DL 9012", model: "Volvo FH", vin: "YV2RTZ0A0BB000003" } });

  // --- Belgeler: kırmızı (geçti) / sarı (≤45g) / yeşil; expiry + interval ---
  // expiry → valid_until kullanılır; interval → last_action kullanılır.
  await prisma.document.createMany({
    data: [
      // Sürücü — expiry
      { docTypeKey: "fuehrerschein", driverId: mehmet.id, validUntil: dateOffset(400), note: "yeşil" },
      { docTypeKey: "modul95", driverId: mehmet.id, validUntil: dateOffset(20), note: "sarı" },
      { docTypeKey: "fahrerkarte", driverId: stefan.id, validUntil: dateOffset(-5), note: "kırmızı (süresi doldu)" },
      { docTypeKey: "adr", driverId: stefan.id, validUntil: dateOffset(120), note: "yeşil" },
      { docTypeKey: "aerztliche_u", driverId: ali.id, validUntil: dateOffset(35), note: "sarı" },
      // Sürücü — interval (28 gün): vade = last_action + 28
      { docTypeKey: "fahrerkarte_dl", driverId: mehmet.id, lastAction: dateOffset(-10), note: "sarı (vade +18g)" },
      { docTypeKey: "fahrerkarte_dl", driverId: ali.id, lastAction: dateOffset(-30), note: "kırmızı (vade -2g)" },

      // Araç — expiry
      { docTypeKey: "hu_tuev", vehicleId: v1.id, validUntil: dateOffset(10), note: "sarı" },
      { docTypeKey: "uvv_sp", vehicleId: v1.id, validUntil: dateOffset(-3), note: "kırmızı (süresi doldu)" },
      { docTypeKey: "hu_tuev", vehicleId: v2.id, validUntil: dateOffset(200), note: "yeşil" },
      { docTypeKey: "tacho_kalibrierung", vehicleId: v3.id, validUntil: dateOffset(60), note: "yeşil" },
      // Araç — interval (90 gün): vade = last_action + 90
      { docTypeKey: "massenspeicher_dl", vehicleId: v2.id, lastAction: dateOffset(-80), note: "sarı (vade +10g)" },
      { docTypeKey: "massenspeicher_dl", vehicleId: v3.id, lastAction: dateOffset(-95), note: "kırmızı (vade -5g)" },
    ],
  });

  // ── EU AI Act: kural seti (versiyonlanabilir referans veri) ──────────────────
  await prisma.aiRuleset.upsert({
    where: { version: AI_RULESET_VERSION },
    create: {
      version: AI_RULESET_VERSION,
      labelDe: "EU KI-Verordnung (2024/1689) — Regelwerk v1",
      labelTr: "AB Yapay Zekâ Yasası (2024/1689) — Kural Seti v1",
      effectiveFrom: new Date(Date.UTC(2024, 7, 1, 12)),
      active: true,
    },
    update: { active: true },
  });
  // Kural ve şablonları sürüm bazında tazele (cascade child; basit ve idempotent).
  await prisma.aiRiskRule.deleteMany({ where: { rulesetVersion: AI_RULESET_VERSION } });
  await prisma.aiRiskRule.createMany({
    data: AI_RISK_RULES.map((r) => ({ ...r, rulesetVersion: AI_RULESET_VERSION })),
  });
  await prisma.aiObligationTemplate.deleteMany({ where: { rulesetVersion: AI_RULESET_VERSION } });
  await prisma.aiObligationTemplate.createMany({
    data: AI_OBLIGATION_TEMPLATES.map((o) => ({ ...o, rulesetVersion: AI_RULESET_VERSION })),
  });

  // ── EU AI Act: örnek sistemler (her risk seviyesinden) ───────────────────────
  // Yüksek riskli sistem → şablonlardan yükümlülük üret (API katmanıyla aynı mantık).
  const highTemplates = AI_OBLIGATION_TEMPLATES.filter((t) => t.riskLevelTrigger === "high");

  // 1) Yüksek risk — işe alım/İK (Annex III)
  await prisma.aiSystem.create({
    data: {
      name: "Bewerber-Screening KI",
      purpose: "Automatisierte Vorauswahl von Bewerbungen im Recruiting.",
      provider: "third_party",
      thirdPartyName: "HR-Tech Solutions GmbH",
      processesPersonalData: true,
      classifications: {
        create: {
          riskLevel: "high",
          rationale: "Anhang III (Beschäftigung/Personalauswahl) — Hochrisiko-KI.",
          rulesetVersion: AI_RULESET_VERSION,
        },
      },
      obligations: {
        create: highTemplates.map((t, i) => ({
          key: t.key,
          titleDe: t.titleDe,
          titleTr: t.titleTr,
          riskLevelTrigger: t.riskLevelTrigger,
          status: i === 0 ? "done" : i === 1 ? "in_progress" : "todo",
        })),
      },
    },
  });

  // 2) Begrenztes Risiko — Chatbot (Transparenzpflicht)
  await prisma.aiSystem.create({
    data: {
      name: "Kundenservice-Chatbot",
      purpose: "Beantwortung von Kundenanfragen im Self-Service-Portal.",
      provider: "internal",
      processesPersonalData: true,
      classifications: {
        create: {
          riskLevel: "limited",
          rationale: "Interagiert direkt mit Nutzern → Transparenzpflicht (Art. 50).",
          rulesetVersion: AI_RULESET_VERSION,
        },
      },
    },
  });

  // 3) Minimales Risiko — Routenoptimierung
  await prisma.aiSystem.create({
    data: {
      name: "Routenoptimierung Fuhrpark",
      purpose: "Optimierung der Tourenplanung zur Kraftstoffeinsparung.",
      provider: "internal",
      processesPersonalData: false,
      classifications: {
        create: {
          riskLevel: "minimal",
          rationale: "Kein Hochrisikobereich, keine Nutzerinteraktion → minimales Risiko.",
          rulesetVersion: AI_RULESET_VERSION,
        },
      },
    },
  });

  // 4) Verboten — Emotionserkennung am Arbeitsplatz (Art. 5)
  await prisma.aiSystem.create({
    data: {
      name: "Emotionserkennung Fahrerkabine",
      purpose: "Erkennung von Emotionen der Fahrer während der Arbeit.",
      provider: "third_party",
      thirdPartyName: "BioSense AG",
      processesPersonalData: true,
      classifications: {
        create: {
          riskLevel: "prohibited",
          rationale: "Emotionserkennung am Arbeitsplatz ist nach Art. 5 KI-VO verboten.",
          rulesetVersion: AI_RULESET_VERSION,
        },
      },
    },
  });

  const counts = {
    docTypes: await prisma.docType.count(),
    users: await prisma.appUser.count(),
    drivers: await prisma.driver.count(),
    vehicles: await prisma.vehicle.count(),
    documents: await prisma.document.count(),
    aiSystems: await prisma.aiSystem.count(),
    aiRiskRules: await prisma.aiRiskRule.count(),
    aiObligations: await prisma.aiObligation.count(),
  };
  console.log("Seed tamamlandı:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
