-- AlterTable
ALTER TABLE "extra_closed_dates" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "overtime_entries" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "staff_rotas" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "leave_requests_organizationId_idx" ON "leave_requests"("organizationId");

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_closed_dates" ADD CONSTRAINT "extra_closed_dates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_rotas" ADD CONSTRAINT "staff_rotas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_entries" ADD CONSTRAINT "overtime_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
