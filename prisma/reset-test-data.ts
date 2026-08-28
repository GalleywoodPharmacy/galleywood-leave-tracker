/**
 * One-off cleanup: run once to clear out test data before real use.
 * Change KEEP_EMAIL below if it's not already correct, then run:
 *   npx tsx prisma/reset-test-data.ts
 *
 * Keeps: the one account below (its login, rota, and allowance settings).
 * Deletes: every other staff account, every leave request, every coverage
 * assignment. Does NOT touch Settings' "extra closed dates".
 *
 * Safe to run only once — if the KEEP_EMAIL account can't be found, it
 * stops immediately without deleting anything.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEEP_EMAIL = "info@galleywoodpharmacy.com";

async function main() {
  const keepUser = await prisma.user.findUnique({ where: { email: KEEP_EMAIL.toLowerCase().trim() } });
  if (!keepUser) {
    throw new Error(`No user found with email ${KEEP_EMAIL} — stopping without deleting anything.`);
  }

  const deletedLeave = await prisma.leaveRequest.deleteMany({});
  const deletedUsers = await prisma.user.deleteMany({ where: { id: { not: keepUser.id } } });

  console.log(`Kept: ${keepUser.name} <${keepUser.email}>`);
  console.log(`Deleted ${deletedUsers.count} other staff account(s).`);
  console.log(`Deleted ${deletedLeave.count} leave request(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });