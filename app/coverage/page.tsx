import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNeedsCoverage } from "@/lib/coverage";
import AppNav from "@/components/app-nav";
import NeedsCoverageList from "@/components/coverage/needs-coverage-list";
import AddCoverageForm from "@/components/coverage/add-coverage-form";
import UpcomingCoverageList from "@/components/coverage/upcoming-coverage-list";

export default async function CoveragePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const [needsCoverage, staff, upcoming] = await Promise.all([
    getNeedsCoverage(60),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.coverageAssignment.findMany({
      where: { date: { gte: todayUTC } },
      include: { user: { select: { name: true } } },
      orderBy: { date: "asc" },
      take: 30,
    }),
  ]);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} />

      <main className="p-6 max-w-3xl mx-auto space-y-8">
        <h1 className="text-xl text-header">Coverage</h1>

        <section>
          <h2 className="text-header text-lg mb-3">Needs coverage</h2>
          <NeedsCoverageList items={needsCoverage.map((d) => ({ key: d.key, namesOnLeave: d.namesOnLeave }))} />
        </section>

        <section>
          <AddCoverageForm isManager={session.user.isManager} staff={staff} />
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">Upcoming coverage</h2>
          <UpcomingCoverageList
            items={upcoming.map((c) => ({ id: c.id, dateKey: c.date.toISOString().slice(0, 10), userName: c.user.name }))}
          />
        </section>
      </main>
    </div>
  );
}
