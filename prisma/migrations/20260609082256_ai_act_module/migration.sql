-- CreateTable
CREATE TABLE "ai_system" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "third_party_name" TEXT,
    "processes_personal_data" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_system_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_classification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ai_system_id" UUID NOT NULL,
    "risk_level" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "ruleset_version" TEXT NOT NULL,
    "classified_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_classification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_obligation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ai_system_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title_de" TEXT NOT NULL,
    "title_tr" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "risk_level_trigger" TEXT NOT NULL,

    CONSTRAINT "ai_obligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_ruleset" (
    "version" TEXT NOT NULL,
    "label_de" TEXT NOT NULL,
    "label_tr" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ai_ruleset_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "ai_risk_rule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ruleset_version" TEXT NOT NULL,
    "ord" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "question_de" TEXT NOT NULL,
    "question_tr" TEXT NOT NULL,
    "help_de" TEXT NOT NULL,
    "help_tr" TEXT NOT NULL,
    "result_risk_level" TEXT NOT NULL,

    CONSTRAINT "ai_risk_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_obligation_template" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ruleset_version" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title_de" TEXT NOT NULL,
    "title_tr" TEXT NOT NULL,
    "risk_level_trigger" TEXT NOT NULL,

    CONSTRAINT "ai_obligation_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_classification_ai_system_id_idx" ON "ai_classification"("ai_system_id");

-- CreateIndex
CREATE INDEX "ai_obligation_ai_system_id_idx" ON "ai_obligation"("ai_system_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_obligation_ai_system_id_key_key" ON "ai_obligation"("ai_system_id", "key");

-- CreateIndex
CREATE INDEX "ai_risk_rule_ruleset_version_idx" ON "ai_risk_rule"("ruleset_version");

-- CreateIndex
CREATE UNIQUE INDEX "ai_risk_rule_ruleset_version_code_key" ON "ai_risk_rule"("ruleset_version", "code");

-- CreateIndex
CREATE INDEX "ai_obligation_template_ruleset_version_idx" ON "ai_obligation_template"("ruleset_version");

-- CreateIndex
CREATE UNIQUE INDEX "ai_obligation_template_ruleset_version_key_key" ON "ai_obligation_template"("ruleset_version", "key");

-- AddForeignKey
ALTER TABLE "ai_classification" ADD CONSTRAINT "ai_classification_ai_system_id_fkey" FOREIGN KEY ("ai_system_id") REFERENCES "ai_system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_obligation" ADD CONSTRAINT "ai_obligation_ai_system_id_fkey" FOREIGN KEY ("ai_system_id") REFERENCES "ai_system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_risk_rule" ADD CONSTRAINT "ai_risk_rule_ruleset_version_fkey" FOREIGN KEY ("ruleset_version") REFERENCES "ai_ruleset"("version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_obligation_template" ADD CONSTRAINT "ai_obligation_template_ruleset_version_fkey" FOREIGN KEY ("ruleset_version") REFERENCES "ai_ruleset"("version") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- v_deadlines görünümünü EU AI Act vadeleriyle genişlet (UNION).
-- Sona `source` ayraç sütunu eklenir ('document' | 'ai_act') — gelecekteki
-- bildirici hangi kaydı kullanacağını bilsin; mevcut sorgular bu sütunu okumaz.
-- AI tarafı: en güncel sınıflandırması 'high' olan ve açık (done olmayan)
-- yükümlülüğü bulunan her sistem, 2026-08-02 son tarihiyle akışa girer.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW "v_deadlines" AS
SELECT d.id,
       dt.key,
       dt.label_de,
       dt.label_tr,
       dt.applies_to,
       dt.mode,
       COALESCE(dr.name, v.plate) AS subject,
       CASE WHEN dt.mode = 'expiry' THEN d.valid_until
            ELSE d.last_action + (dt.interval_days || ' days')::interval
       END::date AS due_date,
       'document'::text AS source
FROM "document" d
JOIN "doc_type" dt ON dt.key = d.doc_type_key
LEFT JOIN "driver"  dr ON dr.id = d.driver_id
LEFT JOIN "vehicle" v  ON v.id  = d.vehicle_id

UNION ALL

SELECT s.id,
       'ai_act_compliance'::text       AS key,
       'EU AI Act – Konformität'::text AS label_de,
       'AB YZ Yasası – Uyum'::text     AS label_tr,
       'ai_system'::text               AS applies_to,
       'deadline'::text                AS mode,
       s.name                          AS subject,
       DATE '2026-08-02'               AS due_date,
       'ai_act'::text                  AS source
FROM "ai_system" s
WHERE (
        SELECT c.risk_level FROM "ai_classification" c
        WHERE c.ai_system_id = s.id
        ORDER BY c.classified_at DESC
        LIMIT 1
      ) = 'high'
  AND EXISTS (
        SELECT 1 FROM "ai_obligation" o
        WHERE o.ai_system_id = s.id AND o.status <> 'done'
      );
