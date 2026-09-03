/**
 * HISTORICAL — its job is done. This backfilled every row to Galleywood
 * back when organizationId was still optional (Phases 1–2a). Now that it's
 * required on every table (Phase 2c), there's nothing left with a null
 * organizationId to backfill, and this script's `where: { organizationId:
 * null }` filters won't even compile cleanly against the tightened schema
 * if you tried to run it again. Kept only for reference — don't run it.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ORG_NAME = "Galleywood Pharmacy";

async function main() {
  let org = await prisma.organization.findFirst({ where: { name: ORG_NAME } });
  if (!org) {
    org = await prisma.organization.create({ data: { name: ORG_NAME } });
    console.log(`Created organization: ${org.name} (${org.id})`);
  } else {
    console.log(`Organization already exists: ${org.name} (${org.id})`);
  }

  const users = await prisma.user.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  });
  console.log(`Linked ${users.count} user(s) to ${org.name}.`);

  const leaveRequests = await prisma.leaveRequest.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  });
  console.log(`Linked ${leaveRequests.count} leave request(s) to ${org.name}.`);

  const staffRotas = await prisma.staffRota.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  });
  console.log(`Linked ${staffRotas.count} staff rota(s) to ${org.name}.`);

  const closedDates = await prisma.extraClosedDate.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  });
  console.log(`Linked ${closedDates.count} extra closed date(s) to ${org.name}.`);

  const overtimeEntries = await prisma.overtimeEntry.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  });
  console.log(
    `Linked ${overtimeEntries.count} overtime entr${overtimeEntries.count === 1 ? "y" : "ies"} to ${org.name}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });