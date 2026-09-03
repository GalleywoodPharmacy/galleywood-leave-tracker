import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthCalendarData } from "@/lib/calendar";
import { getOrgOpenWeekdays, getOrgBranding } from "@/lib/leave";
import { getBlackoutPeriods } from "@/lib/business-rules";
import AppNav from "@/components/app-nav";
import MonthGrid from "@/components/calendar/month-grid";
import PrintButton from "@/components/calendar/print-button";
import CalendarRequestForm from "@/components/calendar/calendar-request-form";
import LogSickLeave from "@/components/calendar/log-sick-leave";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string; selStart?: string; selEnd?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");
  const organizationId = session.user.organizationId;

  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year, 10) : now.getUTCFullYear();
  const month = searchParams.month ? parseInt(searchParams.month, 10) : now.getUTCMonth() + 1;
  const selStart = searchParams.selStart ?? null;
  const selEnd = searchParams.selEnd ?? null;

  const [{ byDate, extraClosedDates }, staffList, openWeekdays, branding] = await Promise.all([
    getMonthCalendarData(year, month, organizationId),
    prisma.user.findMany({
      where: { isDemo: false, organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getOrgOpenWeekdays(organizationId),
    getOrgBranding(organizationId),
  ]);

  // The visible grid can show a few days from the adjacent year (e.g.
  // viewing December includes early-January padding days), so blackout
  // periods are computed for the surrounding years too, not just this one.
  const blackoutPeriods = [
    ...getBlackoutPeriods(year - 1),
    ...getBlackoutPeriods(year),
    ...getBlackoutPeriods(year + 1),
  ];

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  // Carry an in-progress selection across a month change, so a leave
  // request spanning a month boundary doesn't lose its start day.
  let selQuery = "";
  if (selStart) selQuery += "&selStart=" + selStart;
  if (selEnd) selQuery += "&selEnd=" + selEnd;

  return (
    <div className="min-h-screen bg-page print:bg-white">
      <div className="print:hidden">
        <AppNav isManager={session.user.isManager} organizationName={branding.name} organizationLogoUrl={branding.logoUrl} />
      </div>

      <main className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl text-header">
            {MONTH_NAMES[month - 1]} {year}
          </h1>
          <div className="flex gap-2 text-sm print:hidden">
            <Link
              href={`/calendar?year=${prev.year}&month=${prev.month}${selQuery}`}
              className="rounded-lg border border-line px-3 py-1.5 hover:bg-card"
            >
              ← Prev
            </Link>
            <Link
              href={`/calendar?year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}${selQuery}`}
              className="rounded-lg border border-line px-3 py-1.5 hover:bg-card"
            >
              Today
            </Link>
            <Link
              href={`/calendar?year=${next.year}&month=${next.month}${selQuery}`}
              className="rounded-lg border border-line px-3 py-1.5 hover:bg-card"
            >
              Next →
            </Link>
            <PrintButton />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-ink-soft print:hidden">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-pending/40 inline-block" /> Requested</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/40 inline-block" /> Approved</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-declined/40 inline-block" /> Declined</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-coverage/40 inline-block" /> Covered</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-dashed border-red-400 bg-red-50 inline-block" /> No cover yet</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[repeating-linear-gradient(45deg,rgba(21,37,34,0.15),rgba(21,37,34,0.15)_3px,transparent_3px,transparent_6px)] inline-block" />
            Closed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-ink-soft/25 inline-block" />
            Black out period
          </span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-200 inline-block" /> Sick</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Overtime</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-2 ring-inset ring-accent bg-accent/10 inline-block" /> Your selection</span>
        </div>

        <p className="text-xs text-ink-soft print:hidden">
          Click a day to request annual leave, log sickness (managers), or log overtime. Click your own leave (or
          anyone's, if you're a manager) to add or change who's covering it — approved leave shows a small box
          underneath with the cover status.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2">
            <MonthGrid
              year={year}
              month={month}
              byDate={byDate}
              extraClosedDates={extraClosedDates}
              blackoutPeriods={blackoutPeriods}
              currentUserId={session.user.id}
              isManager={session.user.isManager}
              staffList={staffList}
              selStart={selStart}
              selEnd={selEnd}
              openWeekdays={openWeekdays}
            />
          </div>
          <div className="print:hidden space-y-4">
            <CalendarRequestForm currentUserId={session.user.id} byDate={byDate} blackoutPeriods={blackoutPeriods} />
            {session.user.isManager && <LogSickLeave staffList={staffList} />}
          </div>
        </div>
      </main>
    </div>
  );
}