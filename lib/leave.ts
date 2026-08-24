import { prisma } from "./prisma";
import { calculateLeaveHours } from "./business-rules";
import type { LeaveType } from "@prisma/client";

/** Load all extra closures as a Map keyed "YYYY-MM-DD" -> label, for the business-rules functions. */
export async function loadExtraClosedDates(): Promise<Map<string, string>> {
  const rows = await prisma.extraClosedDate.findMany();
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.date.toISOString().slice(0, 10), row.label);
  }
  return map;
}

/** Auto-computed leave hours for a date range, per the opening-hours + closed-day rules. */
export async function computeHoursForRange(startDate: Date, endDate: Date): Promise<number> {
  const extraClosedDates = await loadExtraClosedDates();
  return calculateLeaveHours(startDate, endDate, extraClosedDates);
}

export type LeaveBalance = {
  type: LeaveType;
  allowanceHours: number;
  approvedHours: number;
  pendingHours: number;
  remainingHours: number;
  // Rough days-equivalent using the standard Mon-Fri day length (7.5h), for
  // display only ("≈ days equivalent" per spec) — not used in any hours math.
  remainingDaysApprox: number;
};

const STANDARD_DAY_HOURS = 7.5;
const LEAVE_TYPES: LeaveType[] = ["annual", "sick", "other"];

/**
 * remaining = allowance − sum(approved hours) − sum(pending hours), per type.
 * Cancelled/denied requests are excluded, so withdrawing frees hours
 * immediately (spec section 4).
 *
 * excludeRequestId: when a manager amends an already-approved request's own
 * hours/dates, its *current* (pre-edit) hours must not count against itself,
 * or shrinking a request would false-positive as "over allowance" (spec
 * section 4, "Amending an approved request").
 */
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

/** All staff, each with their balances — for the Team & Approvals table. */
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
