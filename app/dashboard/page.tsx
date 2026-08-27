import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalance } from "@/lib/leave";
import AppNav from "@/components/app-nav";
import BalanceCards from "@/components/leave/balance-cards";
import RequestForm from "@/components/leave/request-form";
import HistoryTable from "@/components/leave/history-table";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [balance, requests] = await Promise.all([
    getBalance(session.user.id),
    prisma.leaveRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { submittedAt: "desc" },
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
        <h1 className="text-xl text-header">My Leave</h1>

        <BalanceCards balance={balance} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <RequestForm />
          <div>
            <h2 className="text-header text-lg mb-3">History</h2>
            <HistoryTable requests={serializedRequests} />
          </div>
        </div>
      </main>
    </div>
  );
}