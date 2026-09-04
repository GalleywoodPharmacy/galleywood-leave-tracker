/**
 * One-off: grants platform-admin access (the cross-business /admin area,
 * for listing and deleting business accounts) to a specific account by
 * email. Edit ADMIN_EMAIL below to your own real login email, then run:
 *   npx tsx prisma/grant-platform-admin.ts
 *
 * Safe to run again for a different email later if you ever need to grant
 * this to someone else — it only touches the one account named below.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "you@example.com"; // <-- change this to your real login email

async function main() {
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const matches = await prisma.user.findMany({ where: { email } });

  if (matches.length === 0) {
    throw new Error(`No account found with email ${email}.`);
  }
  if (matches.length > 1) {
    console.warn(
      `Warning: ${matches.length} accounts share this email across different businesses — granting to the first one found. If that's not the right one, edit this script to target a specific account by id instead.`
    );
  }

  const user = await prisma.user.update({
    where: { id: matches[0].id },
    data: { isPlatformAdmin: true },
  });
  console.log(`Granted platform admin to ${user.email} (id: ${user.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });