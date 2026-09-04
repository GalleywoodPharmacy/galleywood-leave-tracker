"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateInput from "@/components/date-input";

export type BlackoutPeriodItem = { id: string; label: string; startDateKey: string; endDateKeyInclusive: string };

function fmt(key: string) {
  return new Date(key + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export default function BlackoutPeriodsManager({ periods }: { periods: BlackoutPeriodItem[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const todayKey = toDateKey(todayUTC());
  const upcoming = periods.filter((p) => p.endDateKeyInclusive >= todayKey);
  const past = periods.filter((p) => p.endDateKeyInclusive < todayKey);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!label || !startDate || !endDate) {
      setError("Enter a label, start date, and end date.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/settings/blackout-periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, startDate, endDate }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't add that blackout period.");
      return;
    }
    setLabel("");
    setStartDate("");
    setEndDate("");
    router.refresh();
  }

  async function handleRemove(id: string) {
    setBusyId(id);
    await fetch(`/api/settings/blackout-periods/${id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  function renderRow(p: BlackoutPeriodItem) {
    return (
      <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
        <div>
          <span className="font-mono">
            {fmt(p.startDateKey)} – {fmt(p.endDateKeyInclusive)}
          </span>
          <span className="text-ink-soft"> — {p.label}</span>
        </div>
        <button
          disabled={busyId === p.id}
          onClick={() => handleRemove(p.id)}
          className="text-xs text-declined hover:underline disabled:opacity-60"
        >
          {busyId === p.id ? "Removing…" : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-line rounded-xl divide-y divide-line">
        {upcoming.length === 0 && <p className="px-5 py-4 text-sm text-ink-soft">No upcoming custom blackout periods added.</p>}
        {upcoming.map(renderRow)}
      </div>

      {past.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="text-xs text-ink-soft hover:underline"
          >
            {showPast ? "Hide" : "Show"} {past.length} past period{past.length > 1 ? "s" : ""}
          </button>
          {showPast && (
            <div className="mt-2 bg-page border border-line rounded-xl divide-y divide-line opacity-70">
              {past.map(renderRow)}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-white border border-line rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-ink">Add a custom blackout period</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-ink-soft mb-1">Start date</label>
            <DateInput value={startDate} onChange={setStartDate} />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">End date</label>
            <DateInput value={endDate} onChange={setEndDate} />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">Label</label>
            <input
              placeholder="e.g. Peak season"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-declined">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-header disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add blackout period"}
        </button>
      </form>
    </div>
  );
}