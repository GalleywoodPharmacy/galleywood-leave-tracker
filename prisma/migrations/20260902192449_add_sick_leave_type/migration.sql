-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('annual', 'sick');

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "type" "LeaveType" NOT NULL DEFAULT 'annual';
