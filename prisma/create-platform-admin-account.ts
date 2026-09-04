/**
 * One-off: creates a dedicated platform-admin login, completely separate
 * from your own Galleywood business account. It belongs to its own small
 * "Platform Admin" organization (so it never shows up mixed in with
 * Galleywood's real staff list), and isManager is left false — it's not
 * meant for day-to-day business use, only for the cross-business /admin
 * area. Signing in with these credentials goes straight to /admin instead
 * of the regular Dashboard (see components/login/login-form.tsx).
 *
 * Edit ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME below, then run:
 *   npx tsx prisma/create-platform-admin-account.ts
 *
 * Safe to run again later — it updates the existing account rather than
 * creating a duplicate, and resets the password back to the one below if
 * you ever need to.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "info@galleywoodpharmacy.com"; // <-- change this
const ADMIN_PASSWORD = "STARadmin"; // <-- change this
const ADMIN_NAME = "Platform Admin";
const ADMIN_ORG_NAME = "Platform Admin";

async function main() {
  let org = await prisma.organization.findFirst({ where: { name: ADMIN_ORG_NAME } });
  if (!org) {
    org = await prisma.organization.create({ data: { name: ADMIN_ORG_NAME } });
    console.log(`Created "${ADMIN_ORG_NAME}" organization.`);
  }

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: ADMIN_NAME, isManager: false, isPlatformAdmin: true, organizationId: org.id },
    create: {
      email,
      name: ADMIN_NAME,
      passwordHash,
      isManager: false,
      isPlatformAdmin: true,
      organizationId: org.id,
    },
  });

  console.log(`Platform admin account ready: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });