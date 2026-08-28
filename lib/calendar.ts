import { prisma } from "./prisma";
import { loadExtraClosedDates } from "./leave";
import type { CoverInfo } from "./cover";

export type DayChipLeave = {
  requestId: string;
  userId: string;
  name: string;
  status: "pending" | "approved" | "denied";
  cover: CoverInfo | null;
  periodStart: string;
  periodEnd: string;
};
export type DayData = {
  key: string;
  date: Date;
  leave: DayChipLeave[];
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

export async function getMonthCalendarData(year: number, month: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  const [leaveRequests, extraClosedDates] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        status: { in: ["pending", "approved", "denied"] },
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      include: { user: { select: { name: true } } },
    }),
    loadExtraClosedDates(),
  ]);

  const byDate = new Map<string, DayData>();
  const ensure = (d: Date) => {
    const key = dayKey(d);
    if (!byDate.has(key)) byDate.set(key, { key, date: d, leave: [] });
    return byDate.get(key)!;
  };

  for (const r of leaveRequests) {
    const periodStart = dayKey(r.startDate);
    const periodEnd = dayKey(r.endDate);
    const periodCover = (r.coverName as CoverInfo | null) ?? null;
    const overrides = (r.coverNameByDate as Record<string, CoverInfo> | null) ?? {};

    const start = r.startDate.getTime() > monthStart.getTime() ? r.startDate : monthStart;
    const end = r.endDate.getTime() < monthEnd.getTime() ? r.endDate : monthEnd;
    let cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      const dk = dayKey(cursor);
      const cover = overrides[dk] ?? periodCover;
      ensure(cursor).leave.push({
        requestId: r.id,
        userId: r.userId,
        name: r.user.name,
        status: r.status as "pending" | "approved" | "denied",
        cover,
        periodStart,
        periodEnd,
      });
      cursor = addDays(cursor, 1);
    }
  }

  return { monthStart, monthEnd, byDate, extraClosedDates };
}