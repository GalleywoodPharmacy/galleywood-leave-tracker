/**
 * One-off, DESTRUCTIVE: wipes everything from Galleywood's account except
 * your own manager login and the Business settings currently saved on the
 * Settings tab (both left completely untouched).
 *
 * Specifically deletes (irreversibly):
 *   - Every other staff member (and everything tied to them)
 *   - Every leave request, for everyone including you
 *   - Every overtime entry, for everyone including you
 *   - Every staff rota, including your own
 *   - Every extra closed date
 *   - Every custom blackout period
 *
 * Your own login (email/password/isManager/isPlatformAdmin), the
 * organization itself, and every Business settings field are NOT touched
 * — you can sign back in immediately afterward to a clean, empty
 * Galleywood account with your current settings exactly as they are now.
 *
 * Edit KEEP_EMAIL below to your own real Galleywood login email, then run:
 *   npx tsx prisma/reset-galleywood-data.ts
 *
 * There is no undo. Double-check KEEP_EMAIL is correct before running.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEEP_EMAIL = "info@galleywoodpharmacy.com"; // <-- change this to YOUR real Galleywood login email
const ORG_NAME = "Galleywood Pharmacy";

async function main() {
  const org = await prisma.organization.findFirst({ where: { name: ORG_NAME } });
  if (!org) throw new Error(`No organization found named "${ORG_NAME}".`);

  const keepEmail = KEEP_EMAIL.toLowerCase().trim();
  const owner = await prisma.user.findFirst({ where: { email: keepEmail, organizationId: org.id } });
  if (!owner) {
    throw new Error(`No user found with email ${keepEmail} in ${ORG_NAME} — double check KEEP_EMAIL.`);
  }

  // Delete dependent data first (leaf tables), for everyone including the
  // owner, before touching any User rows — avoids any foreign key issues.
  const [leaveDeleted, overtimeDeleted, closedDeleted, blackoutDeleted] = await Promise.all([
    prisma.leaveRequest.deleteMany({ where: { organizationId: org.id } }),
    prisma.overtimeEntry.deleteMany({ where: { organizationId: org.id } }),
    prisma.extraClosedDate.deleteMany({ where: { organizationId: org.id } }),
    prisma.extraBlackoutPeriod.deleteMany({ where: { organizationId: org.id } }),
  ]);
  const rotaDeleted = await prisma.staffRota.deleteMany({ where: { organizationId: org.id } });

  // Now safe to remove every other staff member. The Organization row
  // itself (name, logo, weekday hours, statutory leave weeks, bank
  // holidays setting, blackout config, Saturday teams — everything on the
  // Business settings tab) is deliberately left completely untouched.
  const staffDeleted = await prisma.user.deleteMany({
    where: { organizationId: org.id, id: { not: owner.id } },
  });

  console.log(`Done. Kept login: ${owner.email}`);
  console.log(
    `Removed: ${staffDeleted.count} other staff, ${leaveDeleted.count} leave requests, ${overtimeDeleted.count} overtime entries, ${rotaDeleted.count} rotas, ${closedDeleted.count} extra closed dates, ${blackoutDeleted.count} custom blackout periods.`
  );
  console.log(`Business settings left untouched, as they currently are.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });