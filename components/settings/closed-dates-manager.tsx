"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ClosedDateItem = { dateKey: string; label: string };

function fmt(key: string) {
  return new Date(key + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClosedDatesManager({ dates }: { dates: ClosedDateItem[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date || !label) {
      setError("Enter a date and a label.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/settings/closed-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, label }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't add that closed date.");
      return;
    }
    setDate("");
    setLabel("");
    router.refresh();
  }

  async function handleRemove(dateKey: string) {
    setBusyKey(dateKey);
    await fetch(`/api/settings/closed-dates/${encodeURIComponent(dateKey)}`, { method: "DELETE" });
    setBusyKey(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-line rounded-xl divide-y divide-line">
        {dates.length === 0 && <p className="px-5 py-4 text-sm text-ink-soft">No extra closures added.</p>}
        {dates.map((d) => (
          <div key={d.dateKey} className="flex items-center justify-between px-5 py-3 text-sm">
            <div>
              <span className="font-mono">{fmt(d.dateKey)}</span>
              <span className="text-ink-soft"> — {d.label}</span>
            </div>
            <button
              disabled={busyKey === d.dateKey}
              onClick={() => handleRemove(d.dateKey)}
              className="text-xs text-declined hover:underline disabled:opacity-60"
            >
              {busyKey === d.dateKey ? "Removing…" : "Remove"}
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-line rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-ink">Add a one-off closure</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm font-mono"
          />
          <input
            placeholder="Reason (e.g. Staff training day)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-declined">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-header disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add closure"}
        </button>
      </form>
    </div>
  );
}
