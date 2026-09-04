"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
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
          <div className="h-20 w-20 rounded-full bg-primary/10 shadow-sm flex items-center justify-center border border-line">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary">
              <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 7.1-1.01L12 2z" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl text-header text-center mb-1">Smart Team And Rota (STAR)</h1>
        <p className="text-ink-soft text-center text-sm mb-8">Staff leave, rota &amp; cover planning</p>

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
        <p className="text-center text-sm text-ink-soft mt-2">
          Starting a new business? <a href="/signup" className="text-primary hover:underline">Create an account</a>
        </p>
      </div>
    </div>
  );
}