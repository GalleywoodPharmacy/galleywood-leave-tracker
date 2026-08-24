import { prisma } from "./prisma";
import { loadExtraClosedDates } from "./leave";

export type DayChipLeave = { name: string; type: "annual" | "sick" | "other"; status: "pending" | "approved" | "denied" };
export type DayData = {
  key: string; // YYYY-MM-DD
  date: Date;
  leave: DayChipLeave[];
  coverage: string[]; // names covering that date
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

/** year: full year, month: 1-12 */
export async function getMonthCalendarData(year: number, month: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0)); // last day of month

  const [leaveRequests, coverage, extraClosedDates] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        status: { in: ["pending", "approved", "denied"] },
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      include: { user: { select: { name: true } } },
    }),
    prisma.coverageAssignment.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      include: { user: { select: { name: true } } },
    }),
    loadExtraClosedDates(),
  ]);

  const byDate = new Map<string, DayData>();
  const ensure = (d: Date) => {
    const key = dayKey(d);
    if (!byDate.has(key)) byDate.set(key, { key, date: d, leave: [], coverage: [] });
    return byDate.get(key)!;
  };

  for (const r of leaveRequests) {
    const start = r.startDate.getTime() > monthStart.getTime() ? r.startDate : monthStart;
    const end = r.endDate.getTime() < monthEnd.getTime() ? r.endDate : monthEnd;
    let cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      ensure(cursor).leave.push({ name: r.user.name, type: r.type, status: r.status as "pending" | "approved" | "denied" });
      cursor = addDays(cursor, 1);
    }
  }

  for (const c of coverage) {
    ensure(c.date).coverage.push(c.user.name);
  }

  return { monthStart, monthEnd, byDate, extraClosedDates };
}
