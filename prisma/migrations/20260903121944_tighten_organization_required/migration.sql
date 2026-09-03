/*
  Warnings:

  - The primary key for the `extra_closed_dates` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `organizationId` on table `extra_closed_dates` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `leave_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `overtime_entries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `staff_rotas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "extra_closed_dates" DROP CONSTRAINT "extra_closed_dates_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "overtime_entries" DROP CONSTRAINT "overtime_entries_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "staff_rotas" DROP CONSTRAINT "staff_rotas_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organizationId_fkey";

-- AlterTable
ALTER TABLE "extra_closed_dates" DROP CONSTRAINT "extra_closed_dates_pkey",
ALTER COLUMN "organizationId" SET NOT NULL,
ADD CONSTRAINT "extra_closed_dates_pkey" PRIMARY KEY ("organizationId", "date");

-- AlterTable
ALTER TABLE "leave_requests" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "overtime_entries" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "staff_rotas" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_closed_dates" ADD CONSTRAINT "extra_closed_dates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_rotas" ADD CONSTRAINT "staff_rotas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_entries" ADD CONSTRAINT "overtime_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
