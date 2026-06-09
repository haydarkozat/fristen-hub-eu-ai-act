-- CreateTable
CREATE TABLE "app_user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "lang" TEXT NOT NULL DEFAULT 'de',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "employee_no" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plate" TEXT NOT NULL,
    "model" TEXT,
    "vin" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_type" (
    "key" TEXT NOT NULL,
    "applies_to" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "interval_days" INTEGER,
    "label_de" TEXT NOT NULL,
    "label_tr" TEXT NOT NULL,

    CONSTRAINT "doc_type_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doc_type_key" TEXT NOT NULL,
    "driver_id" UUID,
    "vehicle_id" UUID,
    "valid_until" DATE,
    "last_action" DATE,
    "note" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "threshold" INTEGER NOT NULL,
    "sent_to" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_plate_key" ON "vehicle"("plate");

-- CreateIndex
CREATE INDEX "document_doc_type_key_idx" ON "document"("doc_type_key");

-- CreateIndex
CREATE INDEX "document_driver_id_idx" ON "document"("driver_id");

-- CreateIndex
CREATE INDEX "document_vehicle_id_idx" ON "document"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_log_document_id_threshold_key" ON "notification_log"("document_id", "threshold");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_doc_type_key_fkey" FOREIGN KEY ("doc_type_key") REFERENCES "doc_type"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bir belge YA bir sürücüye YA da bir araca bağlı olmalı (XOR). Teknik plan §2.
ALTER TABLE "document"
  ADD CONSTRAINT "document_driver_xor_vehicle"
  CHECK ( ("driver_id" IS NOT NULL) <> ("vehicle_id" IS NOT NULL) );

-- Tüm vadeleri tek yerde toplayan görünüm. Teknik plan §3.
-- mode='expiry' → due_date = valid_until
-- mode='interval' → due_date = last_action + interval_days
CREATE VIEW "v_deadlines" AS
SELECT d.id,
       dt.key,
       dt.label_de,
       dt.label_tr,
       dt.applies_to,
       dt.mode,
       COALESCE(dr.name, v.plate) AS subject,
       CASE WHEN dt.mode = 'expiry' THEN d.valid_until
            ELSE d.last_action + (dt.interval_days || ' days')::interval
       END::date AS due_date
FROM "document" d
JOIN "doc_type" dt ON dt.key = d.doc_type_key
LEFT JOIN "driver"  dr ON dr.id = d.driver_id
LEFT JOIN "vehicle" v  ON v.id  = d.vehicle_id;
