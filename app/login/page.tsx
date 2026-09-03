import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import LoginForm from "@/components/login/login-form";

// This page has no session to check (nobody's signed in yet), which is
// normally what tells Next.js a page depends on live data and shouldn't be
// statically cached. Without this, the organization lookup below would only
// ever run once at build/deploy time, and branding changes made afterward
// in Settings wouldn't show up here until the next deploy.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Pragmatic single-tenant assumption: shows whichever organization exists
  // first, since there's currently only ever one. Once real multi-tenant
  // sign-up exists, this will need proper tenant resolution (e.g. by
  // subdomain) rather than just grabbing the first row — the login page has
  // no session yet, so there's no other way to know which business this is.
  const organization = await prisma.organization.findFirst({ select: { name: true, logoUrl: true } });

  return (
    <Suspense fallback={null}>
      <LoginForm
        organizationName={organization?.name ?? "Staff Leave & Rota"}
        organizationLogoUrl={organization?.logoUrl ?? null}
      />
    </Suspense>
  );
}