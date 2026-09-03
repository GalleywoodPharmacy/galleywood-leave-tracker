/**
 * One-off setup for multi-tenant support: creates the organization row for
 * Galleywood Pharmacy and links every existing row across every
 * organization-scoped table to it. Safe to run more than once — it won't
 * create a duplicate organization or touch rows that already have one, so
 * it's fine to re-run this each time a new table gets organizationId added
 * in a later phase.
 *
 * Run with:
 *   npx tsx prisma/create-organization.ts
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