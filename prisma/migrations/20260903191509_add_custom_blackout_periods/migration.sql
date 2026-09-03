-- CreateTable
CREATE TABLE "extra_blackout_periods" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "extra_blackout_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extra_blackout_periods_organizationId_idx" ON "extra_blackout_periods"("organizationId");

-- AddForeignKey
ALTER TABLE "extra_blackout_periods" ADD CONSTRAINT "extra_blackout_periods_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
