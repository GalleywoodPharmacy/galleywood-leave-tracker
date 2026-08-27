import { prisma } from "./prisma";
import {
  calculateLeaveHoursForRota,
  calculateStatutoryAnnualHours,
  bankHolidayHoursForRota,
  bankHolidayBreakdownForRota,
  type WeeklyRota,
  type BankHolidayBreakdownItem,
} from "./business-rules";

export async function loadExtraClosedDates(): Promise<Map<string, string>> {
  const rows = await prisma.extraClosedDate.findMany();
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.date.toISOString().slice(0, 10), row.label);
  }
  return map;
}

export const DEFAULT_ROTA: WeeklyRota = { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 };

export async function getRotaForUser(userId: string): Promise<WeeklyRota> {
  const rota = await prisma.staffRota.findUnique({ where: { userId } });
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
async function getStartDateForUser(userId: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { startDate: true } });
  return user?.startDate ?? null;
}

export async function computeHoursForRangeForUser(userId: string, startDate: Date, endDate: Date): Promise<number> {
  const [extraClosedDates, rota] = await Promise.all([loadExtraClosedDates(), getRotaForUser(userId)]);
  return calculateLeaveHoursForRota(startDate, endDate, extraClosedDates, rota);
}

export async function computeStatutoryAnnualHoursForUser(userId: string, year: number): Promise<number> {
  const [rota, extraClosedDates, startDate] = await Promise.all([
    getRotaForUser(userId),
    loadExtraClosedDates(),
    getStartDateForUser(userId),
  ]);
  return calculateStatutoryAnnualHours(rota, year, extraClosedDates, startDate);
}

/**
 * Named breakdown of which closed days (bank holidays / extra closures)
 * reduce this person's allowance in a given year. Leaves out any that
 * happened before their start date, if one is set, and returns nothing at
 * all for a year before they'd started.
 */
export async function getBankHolidayBreakdownForUser(userId: string, year: number): Promise<BankHolidayBreakdownItem[]> {
  const [rota, extraClosedDates, startDate] = await Promise.all([
    getRotaForUser(userId),
    loadExtraClosedDates(),
    getStartDateForUser(userId),
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

/**
 * A person's leave balance for a specific calendar year. The allowance is
 * computed live from their current rota + that year's actual bank holidays
 * (5.6 weeks minus bank-holiday hours that fall on their working days) —
 * it's no longer a manually-saved flat number, so 2026 and 2027 can (and
 * usually will) show slightly different allowances automatically, since
 * bank holidays fall on different weekdays each year. If they have a start
 * date set and it falls within the requested year, their entitlement for
 * that year is pro-rated automatically.
 *
 * A request "belongs" to the calendar year its start date falls in — a
 * request starting 2 Jul 2027 counts against 2027's balance, regardless of
 * what year it was submitted or approved in.
 *
 * excludeRequestId: when a manager amends an already-approved request's own
 * hours/dates, its *current* (pre-edit) hours must not count against itself,
 * or shrinking a request would false-positive as "over allowance".
 */
export async function getBalance(userId: string, year: number, excludeRequestId?: string): Promise<LeaveBalance> {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));

  const [requests, rota, extraClosedDates, startDate] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        userId,
        status: { in: ["approved", "pending"] },
        startDate: { gte: yearStart, lte: yearEnd },
        ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
      },
      select: { status: true, hours: true },
    }),
    getRotaForUser(userId),
    loadExtraClosedDates(),
    getStartDateForUser(userId),
  ]);

  const approvedHours = requests.filter((r) => r.status === "approved").reduce((sum, r) => sum + r.hours, 0);
  const pendingHours = requests.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.hours, 0);
  const allowanceHours = calculateStatutoryAnnualHours(rota, year, extraClosedDates, startDate);
  const bankHolidayFromDateKey =
    startDate && startDate.getUTCFullYear() === year ? startDate.toISOString().slice(0, 10) : undefined;
  const bankHolidayHours =
    startDate && startDate.getUTCFullYear() > year ? 0 : bankHolidayHoursForRota(rota, year, extraClosedDates, bankHolidayFromDateKey);
  const remainingHours = allowanceHours - approvedHours - pendingHours;

  return {
    allowanceHours,
    bankHolidayHours,
    approvedHours,
    pendingHours,
    remainingHours,
    remainingDaysApprox: Math.round((remainingHours / STANDARD_DAY_HOURS) * 10) / 10,
  };
}

/** All staff, each with their balance for a given year — for the Team & Approvals table. */
export async function getAllStaffBalances(year: number) {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const results = await Promise.all(
    users.map(async (u) => ({
      user: { id: u.id, name: u.name, email: u.email, isManager: u.isManager },
      balance: await getBalance(u.id, year),
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
export async function getAllStaffAnnualAllowances(years: number[]) {
  const [users, extraClosedDates] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" }, include: { rota: true } }),
    loadExtraClosedDates(),
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
        hours: calculateStatutoryAnnualHours(rota, year, extraClosedDates, u.startDate),
      })),
    };
  });
}

/** All staff with their rota (or the default, if they don't have one set yet) — for Settings. */
export async function getAllStaffRotas() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" }, include: { rota: true } });
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