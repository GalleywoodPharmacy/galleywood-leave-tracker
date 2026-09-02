/**
 * One-off setup for Phase 1 of multi-tenant support: creates the
 * organization row for Galleywood Pharmacy and links every existing user
 * to it. Safe to run more than once — it won't create a duplicate
 * organization or touch users who already have one.
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

  const result = await prisma.user.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  });

  console.log(`Linked ${result.count} user(s) to ${org.name}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });