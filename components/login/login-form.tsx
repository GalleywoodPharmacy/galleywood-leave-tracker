"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function LoginForm({
  organizationName,
  organizationLogoUrl,
}: {
  organizationName: string;
  organizationLogoUrl: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("That email and password don't match. Try again.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border border-line">
            {organizationLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={organizationLogoUrl} alt={organizationName} className="h-16 w-16 object-contain" />
            ) : (
              <Image src="/logo.jpg" alt={organizationName} width={64} height={64} className="object-contain" />
            )}
          </div>
        </div>

        <h1 className="text-xl text-header text-center mb-1">{organizationName}</h1>
        <p className="text-ink-soft text-center text-sm mb-8">Staff Leave &amp; Rota</p>

        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-ink mb-2">Just want to have a look around?</p>
          <button
            type="button"
            onClick={() => {
              setEmail("demo@galleywoodpharmacy.com");
              setPassword("TryDemo2026!");
            }}
            className="text-sm font-medium text-primary hover:text-header underline"
          >
            Fill in the demo login
          </button>
          <p className="text-xs text-ink-soft mt-1">Nothing you do on the demo account is kept — it resets itself every time.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="text-sm text-declined" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary text-white font-medium py-2 hover:bg-header transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-ink-soft mt-6">
          New here? Ask a manager to set up your account in Settings.
        </p>
      </div>
    </div>
  );
}