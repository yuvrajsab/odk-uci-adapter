-- CreateTable
CREATE TABLE "submission" (
    "id" SERIAL NOT NULL,
    "xml_string" XML NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "remarks" TEXT,
    "instance_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_track" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "phone_no" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "instance_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,

    CONSTRAINT "sms_track_pkey" PRIMARY KEY ("id")
);
