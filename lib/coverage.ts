import { prisma } from "./prisma";
import { loadExtraClosedDates } from "./leave";
import { getClosedReason } from "./business-rules";

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type NeedsCoverageDay = { key: string; date: Date; namesOnLeave: string[] };

/** Open days in the next `daysAhead` with approved leave and zero coverage assignments. */
export async function getNeedsCoverage(daysAhead = 60): Promise<NeedsCoverageDay[]> {
  const start = todayUTC();
  const end = addDays(start, daysAhead);

  const [approvedLeave, coverage, extraClosedDates] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "approved", startDate: { lte: end }, endDate: { gte: start } },
      include: { user: { select: { name: true } } },
    }),
    prisma.coverageAssignment.findMany({ where: { date: { gte: start, lte: end } } }),
    loadExtraClosedDates(),
  ]);

  const leaveByDate = new Map<string, string[]>();
  for (const r of approvedLeave) {
    const rangeStart = r.startDate.getTime() > start.getTime() ? r.startDate : start;
    const rangeEnd = r.endDate.getTime() < end.getTime() ? r.endDate : end;
    let cursor = new Date(rangeStart);
    while (cursor.getTime() <= rangeEnd.getTime()) {
      const key = dayKey(cursor);
      const arr = leaveByDate.get(key) ?? [];
      arr.push(r.user.name);
      leaveByDate.set(key, arr);
      cursor = addDays(cursor, 1);
    }
  }

  const coveredDates = new Set(coverage.map((c) => dayKey(c.date)));

  const result: NeedsCoverageDay[] = [];
  for (const [key, names] of leaveByDate.entries()) {
    if (coveredDates.has(key)) continue;
    const date = new Date(key + "T00:00:00.000Z");
    if (getClosedReason(date, extraClosedDates).closed) continue;
    result.push({ key, date, namesOnLeave: names });
  }

  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}
