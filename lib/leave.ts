import { prisma } from "./prisma";
import {
  calculateLeaveHoursForRota,
  calculateStatutoryAnnualHours,
  bankHolidayHoursForRota,
  bankHolidayBreakdownForRota,
  type WeeklyRota,
  type BankHolidayBreakdownItem,
} from "./business-rules";

export async function loadExtraClosedDates(organizationId: string): Promise<Map<string, string>> {
  const rows = await prisma.extraClosedDate.findMany({ where: { organizationId } });
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.date.toISOString().slice(0, 10), row.label);
  }
  return map;
}

export const DEFAULT_ROTA: WeeklyRota = { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 };

export async function getRotaForUser(userId: string, organizationId: string): Promise<WeeklyRota> {
  const rota = await prisma.staffRota.findFirst({ where: { userId, organizationId } });
  if (!rota) return DEFAULT_ROTA;
  return {
    sun: rota.sundayHours,
    mon: rota.mondayHours,
    tue: rota.tuesdayHours,
    wed: rota.wednesdayHours,
    thu: rota.thursdayHours,
    fri: rota.fridayHours,
    sat: rota.saturdayHours,
  };
}

/** This person's start date, if a manager has set one — used to pro-rate their first year's entitlement. */
async function getStartDateForUser(userId: string, organizationId: string): Promise<Date | null> {
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId }, select: { startDate: true } });
  return user?.startDate ?? null;
}

/**
 * The two organization-level policy settings that affect how much annual
 * leave someone is entitled to: how many weeks' statutory leave the
 * business grants (default 5.6, the UK minimum), and whether bank holidays
 * come out of that allowance or sit outside it entirely.
 */
async function getOrgLeavePolicy(
  organizationId: string
): Promise<{ statutoryLeaveWeeks: number; bankHolidaysIncludedInAllowance: boolean }> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { statutoryLeaveWeeks: true, bankHolidaysIncludedInAllowance: true },
  });
  return org;
}
/**
 * The business's display name and logo — used anywhere the app shows
 * branding instead of a hardcoded "Galleywood Pharmacy". logoUrl is null
 * until a manager sets one in Business settings.
 */
export async function getOrgBranding(organizationId: string): Promise<{ name: string; logoUrl: string | null }> {
  return prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { name: true, logoUrl: true },
  });
}
export async function computeHoursForRangeForUser(
  userId: string,
  startDate: Date,
  endDate: Date,
  organizationId: string
): Promise<number> {
  const [extraClosedDates, rota] = await Promise.all([
    loadExtraClosedDates(organizationId),
    getRotaForUser(userId, organizationId),
  ]);
  return calculateLeaveHoursForRota(startDate, endDate, extraClosedDates, rota);
}

export async function computeStatutoryAnnualHoursForUser(
  userId: string,
  year: number,
  organizationId: string
): Promise<number> {
  const [rota, extraClosedDates, startDate, policy] = await Promise.all([
    getRotaForUser(userId, organizationId),
    loadExtraClosedDates(organizationId),
    getStartDateForUser(userId, organizationId),
    getOrgLeavePolicy(organizationId),
  ]);
  return calculateStatutoryAnnualHours(
    rota,
    year,
    extraClosedDates,
    startDate,
    policy.statutoryLeaveWeeks,
    policy.bankHolidaysIncludedInAllowance
  );
}

/**
 * Named breakdown of which closed days (bank holidays / extra closures)
 * reduce this person's allowance in a given year. Leaves out any that
 * happened before their start date, if one is set, and returns nothing at
 * all for a year before they'd started.
 */
export async function getBankHolidayBreakdownForUser(
  userId: string,
  year: number,
  organizationId: string
): Promise<BankHolidayBreakdownItem[]> {
  const [rota, extraClosedDates, startDate] = await Promise.all([
    getRotaForUser(userId, organizationId),
    loadExtraClosedDates(organizationId),
    getStartDateForUser(userId, organizationId),
  ]);
  if (startDate && startDate.getUTCFullYear() > year) return [];
  const fromDateKey = startDate && startDate.getUTCFullYear() === year ? startDate.toISOString().slice(0, 10) : undefined;
  return bankHolidayBreakdownForRota(rota, year, extraClosedDates, fromDateKey);
}

export type LeaveBalance = {
  allowanceHours: number;
  bankHolidayHours: number;
  approvedHours: number;
  pendingHours: number;
  remainingHours: number;
  remainingDaysApprox: number;
};

const STANDARD_DAY_HOURS = 8;

/** Rounds to 1 decimal place, cleaning up floating-point artifacts from adding/subtracting decimals (e.g. 31.900000000000006). */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * A person's leave balance for a specific calendar year. The allowance is
 * computed live from their current rota + the business's statutory leave
 * weeks setting + (if the business includes them) that year's actual bank
 * holidays — it's no longer a manually-saved flat number, so different
 * years can show different allowances automatically as bank holidays fall
 * on different weekdays each year. If they have a start date set and it
 * falls within the requested year, their entitlement for that year is
 * pro-rated automatically.
 *
 * A request "belongs" to the calendar year its start date falls in — a
 * request starting 2 Jul 2027 counts against 2027's balance, regardless of
 * what year it was submitted or approved in.
 *
 * excludeRequestId: when a manager amends an already-approved request's own
 * hours/dates, its *current* (pre-edit) hours must not count against itself,
 * or shrinking a request would false-positive as "over allowance".
 */
export async function getBalance(
  userId: string,
  year: number,
  organizationId: string,
  excludeRequestId?: string
): Promise<LeaveBalance> {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));

  const [requests, rota, extraClosedDates, startDate, policy] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        userId,
        organizationId,
        type: "annual",
        status: { in: ["approved", "pending"] },
        startDate: { gte: yearStart, lte: yearEnd },
        ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
      },
      select: { status: true, hours: true },
    }),
    getRotaForUser(userId, organizationId),
    loadExtraClosedDates(organizationId),
    getStartDateForUser(userId, organizationId),
    getOrgLeavePolicy(organizationId),
  ]);

  const approvedHours = round1(requests.filter((r) => r.status === "approved").reduce((sum, r) => sum + r.hours, 0));
  const pendingHours = round1(requests.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.hours, 0));
  const allowanceHours = calculateStatutoryAnnualHours(
    rota,
    year,
    extraClosedDates,
    startDate,
    policy.statutoryLeaveWeeks,
    policy.bankHolidaysIncludedInAllowance
  );
  const bankHolidayFromDateKey =
    startDate && startDate.getUTCFullYear() === year ? startDate.toISOString().slice(0, 10) : undefined;
  // Only shown as a deduction line when the business actually deducts bank
  // holidays from the allowance — otherwise it'd misleadingly imply hours
  // were taken away when nothing was.
  const bankHolidayHours =
    !policy.bankHolidaysIncludedInAllowance || (startDate && startDate.getUTCFullYear() > year)
      ? 0
      : bankHolidayHoursForRota(rota, year, extraClosedDates, bankHolidayFromDateKey);
  const remainingHours = round1(allowanceHours - approvedHours - pendingHours);

  return {
    allowanceHours,
    bankHolidayHours,
    approvedHours,
    pendingHours,
    remainingHours,
    remainingDaysApprox: round1(remainingHours / STANDARD_DAY_HOURS),
  };
}

/** All staff, each with their balance for a given year — for the Team & Approvals table. */
export async function getAllStaffBalances(year: number, organizationId: string) {
  const users = await prisma.user.findMany({ where: { isDemo: false, organizationId }, orderBy: { name: "asc" } });
  const results = await Promise.all(
    users.map(async (u) => ({
      user: { id: u.id, name: u.name, email: u.email, isManager: u.isManager },
      balance: await getBalance(u.id, year, organizationId),
    }))
  );
  return results;
}

/**
 * All staff with their automatically-calculated annual allowance for each
 * of the given years (current year + however many ahead) — for the
 * Staff & allowances table in Settings. Fully live from each person's rota
 * and start date; there's no manually-saved figure to keep in sync any more.
 */
export async function getAllStaffAnnualAllowances(years: number[], organizationId: string) {
  const [users, extraClosedDates, policy] = await Promise.all([
    prisma.user.findMany({ where: { isDemo: false, organizationId }, orderBy: { name: "asc" }, include: { rota: true } }),
    loadExtraClosedDates(organizationId),
    getOrgLeavePolicy(organizationId),
  ]);

  return users.map((u) => {
    const rota: WeeklyRota = u.rota
      ? {
          sun: u.rota.sundayHours,
          mon: u.rota.mondayHours,
          tue: u.rota.tuesdayHours,
          wed: u.rota.wednesdayHours,
          thu: u.rota.thursdayHours,
          fri: u.rota.fridayHours,
          sat: u.rota.saturdayHours,
        }
      : DEFAULT_ROTA;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isManager: u.isManager,
      startDate: u.startDate ? u.startDate.toISOString().slice(0, 10) : null,
      allowances: years.map((year) => ({
        year,
        hours: calculateStatutoryAnnualHours(
          rota,
          year,
          extraClosedDates,
          u.startDate,
          policy.statutoryLeaveWeeks,
          policy.bankHolidaysIncludedInAllowance
        ),
      })),
    };
  });
}

/** All staff with their rota (or the default, if they don't have one set yet) — for Settings. */
export async function getAllStaffRotas(organizationId: string) {
  const users = await prisma.user.findMany({
    where: { isDemo: false, organizationId },
    orderBy: { name: "asc" },
    include: { rota: true },
  });
  return users.map((u) => ({
    userId: u.id,
    name: u.name,
    rota: u.rota
      ? {
          sun: u.rota.sundayHours,
          mon: u.rota.mondayHours,
          tue: u.rota.tuesdayHours,
          wed: u.rota.wednesdayHours,
          thu: u.rota.thursdayHours,
          fri: u.rota.fridayHours,
          sat: u.rota.saturdayHours,
        }
      : DEFAULT_ROTA,
    isCustom: !!u.rota,
  }));
}