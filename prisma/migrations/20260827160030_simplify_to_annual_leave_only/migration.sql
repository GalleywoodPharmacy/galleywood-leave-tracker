/*
  Warnings:

  - You are about to drop the column `type` on the `leave_requests` table. All the data in the column will be lost.
  - You are about to drop the column `allowanceOtherHours` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `allowanceSickHours` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "allowanceOtherHours",
DROP COLUMN "allowanceSickHours";

-- DropEnum
DROP TYPE "LeaveType";
