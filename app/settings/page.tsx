import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllStaffRotas, getAllStaffAnnualAllowances } from "@/lib/leave";
import AppNav from "@/components/app-nav";
import StaffTable from "@/components/settings/staff-table";
import ClosedDatesManager from "@/components/settings/closed-dates-manager";
import RotaManager from "@/components/settings/rota-manager";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");
  if (!session.user.isManager) redirect("/dashboard");
  const organizationId = session.user.organizationId;

  const currentYear = new Date().getUTCFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  const [staff, closedDates, staffRotas] = await Promise.all([
    getAllStaffAnnualAllowances(years, organizationId),
    prisma.extraClosedDate.findMany({ where: { organizationId }, orderBy: { date: "asc" } }),
    getAllStaffRotas(organizationId),
  ]);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} />

      <main className="p-6 max-w-4xl mx-auto space-y-8">
        <h1 className="text-xl text-header">Settings</h1>

        <section>
          <h2 className="text-header text-lg mb-3">Staff &amp; allowances</h2>
          <StaffTable staff={staff} years={years} />
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">Staff rotas</h2>
          <RotaManager staffRotas={staffRotas} />
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">Extra closed dates</h2>
          <ClosedDatesManager dates={closedDates.map((d) => ({ dateKey: d.date.toISOString().slice(0, 10), label: d.label }))} />
        </section>
      </main>
    </div>
  );
}