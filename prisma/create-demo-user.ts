/**
 * One-off setup: creates (or updates) the public demo/trial login.
 * Run once with:
 *   npx tsx prisma/create-demo-user.ts
 *
 * Safe to run again later — it updates the existing demo account rather
 * than creating a duplicate, and resets its password back to the one below
 * if you ever need to.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@galleywoodpharmacy.com";
const DEMO_PASSWORD = "TryDemo2026!";
const DEMO_NAME = "Demo Staff";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, isDemo: true, isManager: false, name: DEMO_NAME },
    create: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      passwordHash,
      isDemo: true,
      isManager: false,
    },
  });

  // Give the demo account a realistic rota so trying out "Request leave"
  // shows sensible auto-calculated hours and a real balance, instead of 0.
  await prisma.staffRota.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      sundayHours: 0,
      mondayHours: 8,
      tuesdayHours: 8,
      wednesdayHours: 8,
      thursdayHours: 8,
      fridayHours: 8,
      saturdayHours: 4,
    },
  });

  console.log(`Demo account ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });/**
 * One-off setup: creates (or updates) the public demo/trial login.
 * Run once with:
 *   npx tsx prisma/create-demo-user.ts
 *
 * Safe to run again later — it updates the existing demo account rather
 * than creating a duplicate, and resets its password back to the one below
 * if you ever need to.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@galleywoodpharmacy.com";
const DEMO_PASSWORD = "TryDemo2026!";
const DEMO_NAME = "Demo Staff";
const ORG_NAME = "Galleywood Pharmacy";

async function main() {
  const org = await prisma.organization.findFirst({ where: { name: ORG_NAME } });
  if (!org) {
    throw new Error(`No organization found named "${ORG_NAME}" — run prisma/create-organization.ts first.`);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, isDemo: true, isManager: false, name: DEMO_NAME, organizationId: org.id },
    create: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      passwordHash,
      isDemo: true,
      isManager: false,
      organizationId: org.id,
    },
  });

  // Give the demo account a realistic rota so trying out "Request leave"
  // shows sensible auto-calculated hours and a real balance, instead of 0.
  await prisma.staffRota.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      sundayHours: 0,
      mondayHours: 8,
      tuesdayHours: 8,
      wednesdayHours: 8,
      thursdayHours: 8,
      fridayHours: 8,
      saturdayHours: 4,
    },
  });

  console.log(`Demo account ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });