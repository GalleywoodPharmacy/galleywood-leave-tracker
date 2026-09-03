import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getMonthlyReport, getOpenSickLeave } from "@/lib/reports";
import AppNav from "@/components/app-nav";
import MonthSelect from "@/components/reports/month-select";
import OpenSickLeaveBanner from "@/components/team/open-sick-leave-banner";
import ReportPrintButton from "@/components/reports/print-button";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");
  if (!session.user.isManager) redirect("/dashboard");
  const organizationId = session.user.organizationId;

  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year, 10) : now.getUTCFullYear();
  const month = searchParams.month ? parseInt(searchParams.month, 10) : now.getUTCMonth() + 1;

  const currentYear = now.getUTCFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);
  if (!years.includes(year)) {
    years.push(year);
    years.sort((a, b) => a - b);
  }

  const [report, openSickLeave] = await Promise.all([
    getMonthlyReport(year, month, organizationId),
    getOpenSickLeave(organizationId),
  ]);

  return (
    <div className="min-h-screen bg-page print:bg-white">
      <div className="print:hidden">
        <AppNav isManager={session.user.isManager} />
      </div>

      <main className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl text-header">
            Report — {MONTH_NAMES[month - 1]} {year}
          </h1>
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <MonthSelect year={year} month={month} years={years} />
            <a
              href={`/api/reports/export/xlsx?year=${year}&month=${month}`}
              className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-card"
            >
              Export Excel
            </a>
            <a
              href={`/api/reports/export/pdf?year=${year}&month=${month}`}
              className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-card"
            >
              Export PDF
            </a>
            <ReportPrintButton />
          </div>
        </div>

        <div className="print:hidden">
          <OpenSickLeaveBanner items={openSickLeave} />
        </div>

        <p className="text-xs text-ink-soft print:hidden">
          Normal hours are each person's rota hours for the month, minus annual leave, bank holiday, and sick hours
          taken that month. Total worked adds any overtime logged that month on top. Uses each person's current
          rota — if it's changed recently, past months won't reflect what their rota actually was back then.
        </p>

        <div className="bg-white border border-line rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-soft border-b border-line">
                <th className="px-5 py-3 font-medium">Staff</th>
                <th className="px-5 py-3 font-medium">Rota hours</th>
                <th className="px-5 py-3 font-medium">Normal (worked)</th>
                <th className="px-5 py-3 font-medium">Overtime</th>
                <th className="px-5 py-3 font-medium">Total worked</th>
                <th className="px-5 py-3 font-medium">Annual leave</th>
                <th className="px-5 py-3 font-medium">Bank holiday</th>
                <th className="px-5 py-3 font-medium">Sick</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, i) => (
                <tr key={r.userId} className={i % 2 === 1 ? "bg-card/40" : ""}>
                  <td className="px-5 py-3 border-t border-line font-medium">{r.name}</td>
                  <td className="px-5 py-3 border-t border-line font-mono">{r.rotaHours}h</td>
                  <td className="px-5 py-3 border-t border-line font-mono text-primary">{r.normalHoursWorked}h</td>
                  <td className="px-5 py-3 border-t border-line font-mono text-green-700">{r.overtimeHours}h</td>
                  <td className="px-5 py-3 border-t border-line font-mono font-medium">{r.totalHoursWorked}h</td>
                  <td className="px-5 py-3 border-t border-line font-mono">{r.annualLeaveHours}h</td>
                  <td className="px-5 py-3 border-t border-line font-mono">{r.bankHolidayHours}h</td>
                  <td className="px-5 py-3 border-t border-line font-mono text-purple-700">{r.sickHours}h</td>
                </tr>
              ))}
              {report.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-4 text-ink-soft border-t border-line">
                    No staff to report on yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}