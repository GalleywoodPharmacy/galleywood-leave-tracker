-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "openFriday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openMonday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openSaturday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openSunday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openThursday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openTuesday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openWednesday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "statutoryLeaveWeeks" DOUBLE PRECISION NOT NULL DEFAULT 5.6,
ADD COLUMN     "themeColor" TEXT;
