import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppNav from "@/components/app-nav";
import AccountForm from "@/components/account/account-form";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} />

      <main className="p-6 max-w-md mx-auto space-y-6">
        <h1 className="text-xl text-header">My Account</h1>
        <AccountForm currentEmail={session.user.email ?? ""} />
      </main>
    </div>
  );
}