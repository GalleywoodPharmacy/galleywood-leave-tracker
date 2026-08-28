import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalance, getBankHolidayBreakdownForUser } from "@/lib/leave";
import AppNav from "@/components/app-nav";
import YearSelect from "@/components/year-select";
import BalanceCards from "@/components/leave/balance-cards";
import BankHolidayBreakdown from "@/components/leave/bank-holiday-breakdown";
import UpcomingLeaveCard from "@/components/leave/upcoming-leave-card";
import RequestForm from "@/components/leave/request-form";
import HistoryTable from "@/components/leave/history-table";

export default async function DashboardPage({ searchParams }: { searchParams: { year?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const selectedYear = searchParams.year ? parseInt(searchParams.year, 10) : currentYear;

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);
  if (!yearOptions.includes(selectedYear)) {
    yearOptions.push(selectedYear);
    yearOptions.sort((a, b) => a - b);
  }

  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [balance, bankHolidayItems, requests, nextLeave] = await Promise.all([
    getBalance(session.user.id, selectedYear),
    getBankHolidayBreakdownForUser(session.user.id, selectedYear),
    prisma.leaveRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.leaveRequest.findFirst({
      where: { userId: session.user.id, status: "approved", endDate: { gte: todayUTC } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const serializedRequests = requests.map((r) => ({
    id: r.id,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    hours: r.hours,
    notes: r.notes,
    status: r.status,
    submittedAt: r.submittedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} />

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl text-header">My Leave</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="dashboard-year" className="text-sm text-ink-soft">
              Viewing
            </label>
            <YearSelect years={yearOptions} selectedYear={selectedYear} basePath="/dashboard" />
          </div>
        </div>

        <UpcomingLeaveCard
          leave={
            nextLeave
              ? { startDate: nextLeave.startDate.toISOString(), endDate: nextLeave.endDate.toISOString(), hours: nextLeave.hours }
              : null
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          <BalanceCards balance={balance} year={selectedYear} />
          <BankHolidayBreakdown items={bankHolidayItems} year={selectedYear} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div id="request-leave" className="scroll-mt-6">
            <RequestForm />
          </div>
          <div>
            <h2 className="text-header text-lg mb-3">History</h2>
            <HistoryTable requests={serializedRequests} />
          </div>
        </div>
      </main>
    </div>
  );
}