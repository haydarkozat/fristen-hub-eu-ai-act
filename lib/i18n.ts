// Basit i18n — DE / TR. Aktif dil `lang` çerezinden okunur (varsayılan: de).
// Belge türü etiketleri DB'den gelir (doc_type.label_de / label_tr).
import { cookies } from "next/headers";

export type Lang = "de" | "tr";

export const dict = {
  de: {
    brandSub: "Fuhrpark & Fahrer",
    management: "Verwaltung",
    nav: { overview: "Übersicht", drivers: "Fahrer", vehicles: "Fahrzeuge", calendar: "Fristenkalender", aiAct: "KI-Verordnung" },
    today: "Heute",
    logout: "Abmelden",
    // KPI
    kpiDrivers: "Fahrer", kpiDriversFoot: "im Bestand",
    kpiVehicles: "Fahrzeuge", kpiVehiclesFoot: "im Fuhrpark",
    kpiWarn: "Läuft bald ab", kpiWarnFoot: "in den nächsten 45 Tagen",
    kpiBad: "Abgelaufen", kpiBadFoot: "sofort handeln",
    // Alerts
    criticalTitle: "Kritische Fristen",
    needAttention: (n: number) => `${n} Einträge benötigen Aufmerksamkeit`,
    noCritical: "Keine kritischen Fristen. Alles im grünen Bereich. ✓",
    dueOn: "fällig",
    overdueBy: (n: number) => `${n} Tg. überfällig`,
    inDays: (n: number) => `in ${n} Tg.`,
    // Tables
    driversTitle: "Fahrer & Dokumente",
    driversCount: (n: number) => `${n} Fahrer`,
    vehiclesTitle: "Fuhrpark",
    vehiclesCount: (n: number) => `${n} Fahrzeuge`,
    colDriver: "Fahrer", colVehicle: "Fahrzeug",
    driverNote: "„Karte ausgel.“ = Fahrerkarte muss spätestens alle 28 Tage ausgelesen werden (gesetzliche Pflicht des Unternehmers).",
    vehicleNote: "„Massensp. ausgel.“ = Massenspeicher des Fahrzeugs muss spätestens alle 90 Tage heruntergeladen werden.",
    // Calendar
    calendarTitle: "Fristenkalender",
    calendarSub: "alle anstehenden Termine, chronologisch",
    calendarEmpty: "Keine anstehenden Termine.",
    // Status
    valid: "gültig", expired: "abgelaufen", overdue: "überfällig", daysShort: "Tg.", none: "—",
    // Login
    loginTitle: "Anmelden", loginSubtitle: "Fristen-Hub · Fuhrpark- & Fahrer-Fristenmanagement",
    email: "E-Mail", password: "Passwort", signIn: "Anmelden",
    invalidCreds: "E-Mail oder Passwort ist falsch.", missingFields: "Bitte E-Mail und Passwort eingeben.",
    // Formlar
    addEntry: "+ Eintrag", newDriver: "Neuer Fahrer", newVehicle: "Neues Fahrzeug",
    fName: "Name", fEmployeeNo: "Personalnr.", fPlate: "Kennzeichen", fModel: "Modell",
    save: "Speichern", cancel: "Abbrechen",
    errName: "Bitte Namen eingeben.", errPlate: "Bitte Kennzeichen eingeben.",
    del: "Löschen", confirmDel: "Diesen Eintrag wirklich löschen?",
    untilSuffix: "bis", lastSuffix: "zuletzt",
    // EU AI Act / KI-Verordnung
    aiTitle: "KI-Systeme", aiCount: (n: number) => `${n} Systeme`,
    aiAddSystem: "+ System", aiEmpty: "Noch keine KI-Systeme erfasst.",
    aiColSystem: "System", aiColRisk: "Risikostufe", aiColProvider: "Anbieter", aiColObligations: "Pflichten",
    aiProviderInternal: "Intern", aiProviderThirdParty: "Drittanbieter",
    aiPersonalData: "Pers. Daten",
    riskProhibited: "Verboten", riskHigh: "Hochrisiko", riskLimited: "Begrenztes Risiko",
    riskMinimal: "Minimales Risiko", riskUnknown: "Nicht klassifiziert",
    // Anket / sihirbaz
    aiNewTitle: "Neues KI-System klassifizieren",
    aiStepBasics: "Systemdaten", aiStepSurvey: "Risikofragen",
    aiFPurpose: "Zweck / Verwendung", aiFProvider: "Anbieter",
    aiFThirdPartyName: "Name des Drittanbieters", aiFPersonalData: "Verarbeitet personenbezogene Daten",
    aiYes: "Ja", aiNo: "Nein", aiNext: "Weiter", aiBack: "Zurück", aiClassify: "Klassifizieren",
    aiErrPurpose: "Bitte den Zweck angeben.",
    // Sonuç / detay
    aiResultTitle: "Klassifizierungsergebnis", aiRationale: "Begründung",
    aiRuleset: "Regelwerk", aiClassifiedAt: "Klassifiziert am",
    aiProhibitedWarn: "Diese Praxis ist nach EU AI Act (Art. 5) verboten und darf nicht eingesetzt werden.",
    aiObligationsTitle: "Pflichten-Checkliste",
    aiNoObligations: "Für diese Risikostufe sind keine spezifischen Pflichten zu erfüllen.",
    aiDeadlineNote: (n: number) =>
      `Pflichten für Hochrisiko-KI gelten ab 02.08.2026 — noch ${n} Tage.`,
    aiStatusTodo: "Offen", aiStatusInProgress: "In Arbeit", aiStatusDone: "Erledigt",
    aiBackToList: "← Übersicht",
    // Dashboard-Karten
    aiKpi: "KI-Systeme", aiKpiFoot: "im Einsatz",
    aiKpiHigh: "Hochrisiko-KI", aiKpiHighFoot: "Pflichten erforderlich",
    aiKpiDeadline: "AI-Act-Frist", aiKpiDeadlineFoot: "bis 02.08.2026",
    aiDaysLeft: (n: number) => `${n} Tage`,
    locale: "de-DE",
  },
  tr: {
    brandSub: "Filo & Sürücü",
    management: "Yönetim",
    nav: { overview: "Genel Bakış", drivers: "Sürücüler", vehicles: "Araçlar", calendar: "Vade Takvimi", aiAct: "AI Act" },
    today: "Bugün",
    logout: "Çıkış",
    kpiDrivers: "Sürücü", kpiDriversFoot: "kayıtlı",
    kpiVehicles: "Araç", kpiVehiclesFoot: "filoda",
    kpiWarn: "Yakında doluyor", kpiWarnFoot: "önümüzdeki 45 gün içinde",
    kpiBad: "Süresi doldu", kpiBadFoot: "hemen işlem yap",
    criticalTitle: "Kritik Tarihler",
    needAttention: (n: number) => `${n} kayıt dikkat gerektiriyor`,
    noCritical: "Kritik tarih yok. Her şey yolunda. ✓",
    dueOn: "son tarih",
    overdueBy: (n: number) => `${n} gün gecikti`,
    inDays: (n: number) => `${n} gün içinde`,
    driversTitle: "Sürücüler & Belgeler",
    driversCount: (n: number) => `${n} sürücü`,
    vehiclesTitle: "Filo",
    vehiclesCount: (n: number) => `${n} araç`,
    colDriver: "Sürücü", colVehicle: "Araç",
    driverNote: "„Kart okundu“ = Sürücü kartı en geç her 28 günde bir okunmalıdır (işverenin yasal yükümlülüğü).",
    vehicleNote: "„Kütle belleği okundu“ = Aracın kütle belleği en geç her 90 günde bir indirilmelidir.",
    calendarTitle: "Vade Takvimi",
    calendarSub: "tüm yaklaşan tarihler, kronolojik",
    calendarEmpty: "Yaklaşan tarih yok.",
    valid: "geçerli", expired: "süresi doldu", overdue: "gecikti", daysShort: "gün", none: "—",
    loginTitle: "Giriş", loginSubtitle: "Fristen-Hub · Filo & Sürücü Vade Yönetimi",
    email: "E-posta", password: "Parola", signIn: "Giriş yap",
    invalidCreds: "E-posta veya parola hatalı.", missingFields: "Lütfen e-posta ve parola girin.",
    // Formlar
    addEntry: "+ Kayıt", newDriver: "Yeni Sürücü", newVehicle: "Yeni Araç",
    fName: "Ad", fEmployeeNo: "Personel No", fPlate: "Plaka", fModel: "Model",
    save: "Kaydet", cancel: "İptal",
    errName: "Lütfen ad girin.", errPlate: "Lütfen plaka girin.",
    del: "Sil", confirmDel: "Bu kaydı silmek istediğinize emin misiniz?",
    untilSuffix: "bitiş", lastSuffix: "son okuma",
    // EU AI Act / Yapay Zekâ Yasası
    aiTitle: "Yapay Zekâ Sistemleri", aiCount: (n: number) => `${n} sistem`,
    aiAddSystem: "+ Sistem", aiEmpty: "Henüz yapay zekâ sistemi eklenmedi.",
    aiColSystem: "Sistem", aiColRisk: "Risk Seviyesi", aiColProvider: "Sağlayıcı", aiColObligations: "Yükümlülükler",
    aiProviderInternal: "Şirket içi", aiProviderThirdParty: "Üçüncü taraf",
    aiPersonalData: "Kişisel veri",
    riskProhibited: "Yasaklı", riskHigh: "Yüksek risk", riskLimited: "Sınırlı risk",
    riskMinimal: "Asgari risk", riskUnknown: "Sınıflandırılmadı",
    // Anket / sihirbaz
    aiNewTitle: "Yeni YZ sistemini sınıflandır",
    aiStepBasics: "Sistem bilgileri", aiStepSurvey: "Risk soruları",
    aiFPurpose: "Amaç / Kullanım", aiFProvider: "Sağlayıcı",
    aiFThirdPartyName: "Üçüncü taraf adı", aiFPersonalData: "Kişisel veri işliyor",
    aiYes: "Evet", aiNo: "Hayır", aiNext: "İleri", aiBack: "Geri", aiClassify: "Sınıflandır",
    aiErrPurpose: "Lütfen amaç girin.",
    // Sonuç / detay
    aiResultTitle: "Sınıflandırma sonucu", aiRationale: "Gerekçe",
    aiRuleset: "Kural seti", aiClassifiedAt: "Sınıflandırma tarihi",
    aiProhibitedWarn: "Bu uygulama AB AI Act (Md. 5) uyarınca yasaktır ve kullanılamaz.",
    aiObligationsTitle: "Yükümlülük kontrol listesi",
    aiNoObligations: "Bu risk seviyesi için özel yükümlülük bulunmuyor.",
    aiDeadlineNote: (n: number) =>
      `Yüksek riskli YZ yükümlülükleri 02.08.2026'da yürürlüğe giriyor — ${n} gün kaldı.`,
    aiStatusTodo: "Açık", aiStatusInProgress: "Devam ediyor", aiStatusDone: "Tamamlandı",
    aiBackToList: "← Liste",
    // Dashboard kartları
    aiKpi: "YZ Sistemleri", aiKpiFoot: "kullanımda",
    aiKpiHigh: "Yüksek riskli YZ", aiKpiHighFoot: "yükümlülük gerekli",
    aiKpiDeadline: "AI Act son tarihi", aiKpiDeadlineFoot: "02.08.2026'ya",
    aiDaysLeft: (n: number) => `${n} gün`,
    locale: "tr-TR",
  },
} as const;

export type Dict = (typeof dict)[Lang];

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get("lang")?.value;
  return value === "tr" ? "tr" : "de";
}

export function t(lang: Lang): Dict {
  return dict[lang];
}
