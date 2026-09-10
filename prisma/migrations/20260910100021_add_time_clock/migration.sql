-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "timeClockEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "workplace_locations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Workplace',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 150,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workplace_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clock_shifts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockInLat" DOUBLE PRECISION NOT NULL,
    "clockInLng" DOUBLE PRECISION NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "clockOutLat" DOUBLE PRECISION,
    "clockOutLng" DOUBLE PRECISION,

    CONSTRAINT "clock_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workplace_locations_organizationId_key" ON "workplace_locations"("organizationId");

-- CreateIndex
CREATE INDEX "clock_shifts_userId_idx" ON "clock_shifts"("userId");

-- CreateIndex
CREATE INDEX "clock_shifts_organizationId_idx" ON "clock_shifts"("organizationId");

-- CreateIndex
CREATE INDEX "clock_shifts_date_idx" ON "clock_shifts"("date");

-- AddForeignKey
ALTER TABLE "workplace_locations" ADD CONSTRAINT "workplace_locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clock_shifts" ADD CONSTRAINT "clock_shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clock_shifts" ADD CONSTRAINT "clock_shifts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
