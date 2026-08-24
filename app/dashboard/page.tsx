import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppNav from "@/components/app-nav";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} />

      <main className="p-6">
        <div className="bg-white border border-line rounded-xl p-6 max-w-lg">
          <p className="text-ink">
            Signed in as <span className="font-medium">{session.user.name}</span> ({session.user.email})
          </p>
          <p className="text-ink-soft text-sm mt-1">
            Role: {session.user.isManager ? "Manager" : "Staff"}
          </p>
          <p className="text-ink-soft text-sm mt-4">
            Head to <span className="font-medium">My Leave</span> to see your balances and submit a request.
            Calendar, Coverage, and Team &amp; Approvals views are next.
          </p>
        </div>
      </main>
    </div>
  );
}
