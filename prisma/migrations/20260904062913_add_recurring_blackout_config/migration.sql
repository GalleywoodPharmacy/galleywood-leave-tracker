-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "preChristmasBlackoutEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preChristmasBlackoutWeeks" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "preEasterBlackoutEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preEasterBlackoutWeeks" INTEGER NOT NULL DEFAULT 1;
