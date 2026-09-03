import { prisma } from "./prisma";
import { DEFAULT_ROTA, loadExtraClosedDates } from "./leave";
import { calculateLeaveHoursForRota, bankHolidayBreakdownForRota, type WeeklyRota } from "./business-rules";

export type OpenSickLeave = { requestId: string; name: string; startDate: string };

/** Sick leave entries still sitting on their unconfirmed placeholder end date — these can make a month's hours look wrong until someone finalizes them. */
export async function getOpenSickLeave(): Promise<OpenSickLeave[]> {
  const rows = await prisma.leaveRequest.findMany({
    where: { type: "sick", openEnded: true, status: "approved" },
    include: { user: { select: { name: true } } },
    orderBy: { startDate: "asc" },
  });
  return rows.map((r) => ({
    requestId: r.id,
    name: r.user.name,
    startDate: r.startDate.toISOString().slice(0, 10),
  }));
}

export type MonthlyStaffReport = {
  userId: string;
  name: string;
  rotaHours: number;
  annualLeaveHours: number;
  bankHolidayHours: number;
  sickHours: number;
  normalHoursWorked: number;
  overtimeHours: number;
  totalHoursWorked: number;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Total scheduled hours for this rota over every day in the given month, regardless of closures or leave. */
function rotaHoursForMonth(rota: WeeklyRota, year: number, month: number): number {
  const byWeekday = [rota.sun, rota.mon, rota.tue, rota.wed, rota.thu, rota.fri, rota.sat];
  const numDays = daysInMonth(year, month);
  let total = 0;
  for (let d = 1; d <= numDays; d++) {
    const weekday = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    total += byWeekday[weekday];
  }
  return round1(total);
}

/**
 * Per-staff hours breakdown for one calendar month:
 *   Normal (worked) hours = rota hours for the month
 *                            − annual leave hours taken that month
 *                            − bank holiday hours that month
 *                            − sick hours that month
 *   Total worked hours = Normal (worked) + overtime hours logged that month
 *
 * Annual leave and sick hours are recomputed for just the days of each
 * request that fall within this month (a request spanning a month
 * boundary only contributes its share to each month), using the rota
 * each person has right now — not whatever rota they had back then, since
 * the app doesn't keep rota history. Bank holiday hours already exclude
 * any day someone was also on leave (that day already counts as 0 leave
 * hours, consistent with how the rest of the app treats bank holidays
 * inside a leave period), so there's no double-counting between the two.
 * Overtime entries are single-day, so no month-boundary clipping is needed
 * for them.
 */
export async function getMonthlyReport(year: number, month: number): Promise<MonthlyStaffReport[]> {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const [users, extraClosedDates, leaveRequests, overtimeEntries] = await Promise.all([
    prisma.user.findMany({ where: { isDemo: false }, orderBy: { name: "asc" }, include: { rota: true } }),
    loadExtraClosedDates(),
    prisma.leaveRequest.findMany({
      where: {
        status: "approved",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
    }),
    prisma.overtimeEntry.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
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

    const rotaHours = rotaHoursForMonth(rota, year, month);

    const bankHolidayHours = round1(
      bankHolidayBreakdownForRota(rota, year, extraClosedDates)
        .filter((item) => item.dateKey.startsWith(monthKey))
        .reduce((sum, item) => sum + item.hours, 0)
    );

    let annualLeaveHours = 0;
    let sickHours = 0;
    for (const r of leaveRequests.filter((r) => r.userId === u.id)) {
      const clipStart = r.startDate.getTime() > monthStart.getTime() ? r.startDate : monthStart;
      const clipEnd = r.endDate.getTime() < monthEnd.getTime() ? r.endDate : monthEnd;
      const hours = calculateLeaveHoursForRota(clipStart, clipEnd, extraClosedDates, rota);
      if (r.type === "sick") sickHours += hours;
      else annualLeaveHours += hours;
    }
    annualLeaveHours = round1(annualLeaveHours);
    sickHours = round1(sickHours);

    const normalHoursWorked = Math.max(0, round1(rotaHours - annualLeaveHours - bankHolidayHours - sickHours));

    const overtimeHours = round1(
      overtimeEntries.filter((o) => o.userId === u.id).reduce((sum, o) => sum + o.hours, 0)
    );
    const totalHoursWorked = round1(normalHoursWorked + overtimeHours);

    return {
      userId: u.id,
      name: u.name,
      rotaHours,
      annualLeaveHours,
      bankHolidayHours,
      sickHours,
      normalHoursWorked,
      overtimeHours,
      totalHoursWorked,
    };
  });
}