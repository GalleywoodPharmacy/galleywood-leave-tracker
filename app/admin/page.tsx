import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrgBranding } from "@/lib/leave";
import AppNav from "@/components/app-nav";
import OrganizationsList from "@/components/admin/organizations-list";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");
  if (!session.user.isPlatformAdmin) redirect("/dashboard");

  const [branding, organizations] = await Promise.all([
    getOrgBranding(session.user.organizationId),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
        users: { where: { isManager: true }, orderBy: { createdAt: "asc" }, take: 1, select: { email: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} organizationName={branding.name} organizationLogoUrl={branding.logoUrl} />

      <main className="p-6 max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl text-header">Business accounts</h1>
        <p className="text-xs text-ink-soft">
          Every business using this app. Deleting one removes all of its staff, leave, and settings permanently —
          there's no undo.
        </p>
        <OrganizationsList
          organizations={organizations.map((org) => ({
            id: org.id,
            name: org.name,
            createdAt: org.createdAt.toISOString(),
            userCount: org._count.users,
            firstManagerEmail: org.users[0]?.email ?? null,
          }))}
          currentOrgId={session.user.organizationId}
        />
      </main>
    </div>
  );
}