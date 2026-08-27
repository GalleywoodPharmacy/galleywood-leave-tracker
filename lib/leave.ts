import { prisma } from "./prisma";
import { calculateLeaveHoursForRota, calculateStatutoryAnnualHours, type WeeklyRota } from "./business-rules";
import type { LeaveType } from "@prisma/client";

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

export type LeaveBalance = {
  type: LeaveType;
  allowanceHours: number;
  approvedHours: number;
  pendingHours: number;
  remainingHours: number;
  remainingDaysApprox: number;
};

const STANDARD_DAY_HOURS = 7.5;
const LEAVE_TYPES: LeaveType[] = ["annual", "sick", "other"];

export async function getBalances(userId: string, excludeRequestId?: string): Promise<LeaveBalance[]> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const requests = await prisma.leaveRequest.findMany({
    where: {
      userId,
      status: { in: ["approved", "pending"] },
      ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
    },
    select: { type: true, status: true, hours: true },
  });

  const allowanceByType: Record<LeaveType, number> = {
    annual: user.allowanceAnnualHours,
    sick: user.allowanceSickHours,
    other: user.allowanceOtherHours,
  };

  return LEAVE_TYPES.map((type) => {
    const approvedHours = requests
      .filter((r) => r.type === type && r.status === "approved")
      .reduce((sum, r) => sum + r.hours, 0);
    const pendingHours = requests
      .filter((r) => r.type === type && r.status === "pending")
      .reduce((sum, r) => sum + r.hours, 0);
    const allowanceHours = allowanceByType[type];
    const remainingHours = allowanceHours - approvedHours - pendingHours;

    return {
      type,
      allowanceHours,
      approvedHours,
      pendingHours,
      remainingHours,
      remainingDaysApprox: Math.round((remainingHours / STANDARD_DAY_HOURS) * 10) / 10,
    };
  });
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Annual leave",
  sick: "Sick",
  other: "Other",
};

export async function getAllStaffBalances() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const results = await Promise.all(
    users.map(async (u) => ({
      user: { id: u.id, name: u.name, email: u.email, isManager: u.isManager },
      balances: await getBalances(u.id),
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