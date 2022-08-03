-- CreateTable
CREATE TABLE "submission" (
    "id" SERIAL NOT NULL,
    "xml_string" XML NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);
