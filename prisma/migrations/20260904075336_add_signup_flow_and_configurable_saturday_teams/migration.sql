-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "saturdayTeamANames" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "saturdayTeamAnchorDate" DATE,
ADD COLUMN     "saturdayTeamBNames" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "saturdayTeamsEnabled" BOOLEAN NOT NULL DEFAULT false;
