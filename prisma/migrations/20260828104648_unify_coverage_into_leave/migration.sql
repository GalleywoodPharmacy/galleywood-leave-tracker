/*
  Warnings:

  - The `coverName` column on the `leave_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `coverage_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "coverage_assignments" DROP CONSTRAINT "coverage_assignments_createdById_fkey";

-- DropForeignKey
ALTER TABLE "coverage_assignments" DROP CONSTRAINT "coverage_assignments_userId_fkey";

-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "coverName",
ADD COLUMN     "coverName" JSONB;

-- DropTable
DROP TABLE "coverage_assignments";
