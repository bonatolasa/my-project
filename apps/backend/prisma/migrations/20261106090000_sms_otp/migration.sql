CREATE TYPE "OutboundMessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

CREATE TABLE "outbound_sms" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "provider_message_id" VARCHAR(180),
    "recipient" VARCHAR(40) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "OutboundMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "simulated" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "outbound_sms_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "outbound_sms_user_id_created_at_idx" ON "outbound_sms"("user_id", "created_at" DESC);
CREATE INDEX "outbound_sms_status_created_at_idx" ON "outbound_sms"("status", "created_at");
ALTER TABLE "outbound_sms" ADD CONSTRAINT "outbound_sms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "purpose" VARCHAR(40) NOT NULL,
    "code_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "otp_verifications_user_id_phone_purpose_created_at_idx" ON "otp_verifications"("user_id", "phone", "purpose", "created_at" DESC);
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
