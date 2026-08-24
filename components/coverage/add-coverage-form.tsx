"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddCoverageForm({
  isManager,
  staff,
}: {
  isManager: boolean;
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [userId, setUserId] = useState<string>(""); // "" = self
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) {
      setError("Pick a date.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/coverage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, userId: userId || undefined }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't add that coverage.");
      return;
    }
    setDate("");
    setUserId("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-5 space-y-3">
      <h2 className="text-header text-lg">Add coverage</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        {isManager && (
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Who</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Myself</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-declined">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-coverage text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add coverage"}
      </button>
    </form>
  );
}
