import { prisma } from "./prisma";
import { getRotaForUser } from "./leave";
import type { WeeklyRota } from "./business-rules";

const WEEKDAY_KEYS: (keyof WeeklyRota)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export async function getWorkplaceLocation(organizationId: string) {
  return prisma.workplaceLocation.findUnique({ where: { organizationId } });
}

export async function getOpenShiftForUser(userId: string, organizationId: string) {
  return prisma.clockShift.findFirst({
    where: { userId, organizationId, clockOutAt: null },
    orderBy: { clockInAt: "desc" },
  });
}

export type ShiftWithComparison = {
  id: string;
  date: string;
  clockInAt: string;
  clockOutAt: string | null;
  hoursWorked: number | null;
  rotaHours: number;
  // "under"/"over" compare total hours worked against that weekday's rota
  // (not time-of-day lateness — the rota doesn't currently record expected
  // start/end times, just total hours per day).
  comparison: "under" | "over" | "on-track" | "in-progress";
  differenceHours: number | null;
};

// How far total hours can differ from the rota before it's flagged either
// way — small enough to catch a genuinely short/long day, generous enough
// not to flag every few-minutes variation.
const GRACE_HOURS = 0.25;

function withComparison(
  shift: { id: string; date: Date; clockInAt: Date; clockOutAt: Date | null },
  rota: WeeklyRota
): ShiftWithComparison {
  const weekday = WEEKDAY_KEYS[shift.date.getUTCDay()];
  const rotaHours = rota[weekday];
  const hoursWorked = shift.clockOutAt ? (shift.clockOutAt.getTime() - shift.clockInAt.getTime()) / 3600000 : null;

  let comparison: ShiftWithComparison["comparison"];
  let differenceHours: number | null = null;
  if (hoursWorked === null) {
    comparison = "in-progress";
  } else {
    differenceHours = Math.round((hoursWorked - rotaHours) * 100) / 100;
    comparison = differenceHours < -GRACE_HOURS ? "under" : differenceHours > GRACE_HOURS ? "over" : "on-track";
  }

  return {
    id: shift.id,
    date: shift.date.toISOString().slice(0, 10),
    clockInAt: shift.clockInAt.toISOString(),
    clockOutAt: shift.clockOutAt ? shift.clockOutAt.toISOString() : null,
    hoursWorked: hoursWorked !== null ? Math.round(hoursWorked * 100) / 100 : null,
    rotaHours,
    comparison,
    differenceHours,
  };
}

/** One person's recent shifts, most recent first, each compared against that weekday's rota. */
export async function getRecentShiftsForUser(
  userId: string,
  organizationId: string,
  limit = 20
): Promise<ShiftWithComparison[]> {
  const [shifts, rota] = await Promise.all([
    prisma.clockShift.findMany({
      where: { userId, organizationId },
      orderBy: { date: "desc" },
      take: limit,
    }),
    getRotaForUser(userId, organizationId),
  ]);

  return shifts.map((s) => withComparison(s, rota));
}

/** Every staff member's recent shifts, for managers — same comparison logic, across everyone. */
export async function getRecentShiftsForOrg(
  organizationId: string,
  limit = 50
): Promise<(ShiftWithComparison & { userName: string })[]> {
  const shifts = await prisma.clockShift.findMany({
    where: { organizationId },
    orderBy: { date: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });

  // Cache each person's rota so a busy list doesn't refetch it per shift.
  const rotaCache = new Map<string, WeeklyRota>();
  const results: (ShiftWithComparison & { userName: string })[] = [];

  for (const s of shifts) {
    let rota = rotaCache.get(s.userId);
    if (!rota) {
      rota = await getRotaForUser(s.userId, organizationId);
      rotaCache.set(s.userId, rota);
    }
    results.push({ ...withComparison(s, rota), userName: s.user.name });
  }

  return results;
}