/**
 * Creates the first manager account. Run once after your first migration:
 *   npm run db:seed
 *
 * Reads from env vars so the real password never lives in source control:
 *   SEED_MANAGER_NAME, SEED_MANAGER_EMAIL, SEED_MANAGER_PASSWORD
 *
 * After logging in as this manager, use Settings (once built) to add the
 * rest of the team — no further seeding needed.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SEED_MANAGER_NAME;
  const email = process.env.SEED_MANAGER_EMAIL;
  const password = process.env.SEED_MANAGER_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "Set SEED_MANAGER_NAME, SEED_MANAGER_EMAIL and SEED_MANAGER_PASSWORD before running db:seed."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const manager = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: {},
    create: {
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      isManager: true,
    },
  });

  console.log(`Manager account ready: ${manager.email} (id: ${manager.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
