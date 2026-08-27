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

export const DEFAULT_ROTA: WeeklyRota = { sun: 0, mon: 7.5, tue: 7.5, wed: 7.5, thu: 7.5, fri: 7.5, sat: 4 };

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

export async function computeHoursForRangeForUser(userId: string, startDate: Date, endDate: Date): Promise<number> {
  const [extraClosedDates, rota] = await Promise.all([loadExtraClosedDates(), getRotaForUser(userId)]);
  return calculateLeaveHoursForRota(startDate, endDate, extraClosedDates, rota);
}

export async function computeStatutoryAnnualHoursForUser(userId: string, year: number): Promise<number> {
  const [rota, extraClosedDates] = await Promise.all([getRotaForUser(userId), loadExtraClosedDates()]);
  return calculateStatutoryAnnualHours(rota, year, extraClosedDates);
}

export async function getBankHolidayBreakdownForUser(userId: string, year: number): Promise<BankHolidayBreakdownItem[]> {
  const [rota, extraClosedDates] = await Promise.all([getRotaForUser(userId), loadExtraClosedDates()]);
  return bankHolidayBreakdownForRota(rota, year, extraClosedDates);
}

export type LeaveBalance = {
  allowanceHours: number;
  bankHolidayHours: number;
  approvedHours: number;
  pendingHours: number;
  remainingHours: number;
  remainingDaysApprox: number;
};

const STANDARD_DAY_HOURS = 7.5;

export async function getBalance(userId: string, excludeRequestId?: string): Promise<LeaveBalance> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const [requests, rota, extraClosedDates] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        userId,
        status: { in: ["approved", "pending"] },
        ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
      },
      select: { status: true, hours: true },
    }),
    getRotaForUser(userId),
    loadExtraClosedDates(),
  ]);

  const approvedHours = requests.filter((r) => r.status === "approved").reduce((sum, r) => sum + r.hours, 0);
  const pendingHours = requests.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.hours, 0);
  const allowanceHours = user.allowanceAnnualHours;
  const bankHolidayHours = bankHolidayHoursForRota(rota, new Date().getFullYear(), extraClosedDates);
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

export async function getAllStaffBalances() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const results = await Promise.all(
    users.map(async (u) => ({
      user: { id: u.id, name: u.name, email: u.email, isManager: u.isManager },
      balance: await getBalance(u.id),
    }))
  );
  return results;
}

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