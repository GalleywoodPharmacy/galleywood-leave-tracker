"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DateInput from "@/components/date-input";

export default function RequestForm() {
  const router = useRouter();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState<string>("");
  const [hoursTouched, setHoursTouched] = useState(false);
  const [computing, setComputing] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAutoHours = useCallback(async (start: string, end: string) => {
    if (!start || !end || start > end) return;
    setComputing(true);
    try {
      const res = await fetch("/api/leave/compute-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: start, endDate: end }),
      });
      const data = await res.json();
      if (res.ok) {
        setHours(String(data.hours));
        setHoursTouched(false);
      }
    } finally {
      setComputing(false);
    }
  }, []);

  useEffect(() => {
    if (!hoursTouched) fetchAutoHours(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Pick a start and end date.");
      return;
    }
    const parsedHours = parseFloat(hours);
    if (!parsedHours || parsedHours <= 0) {
      setError("Enter how many hours this request covers.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate,
        endDate,
        hours: parsedHours,
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Couldn't submit that request.");
      return;
    }

    setStartDate("");
    setEndDate("");
    setHours("");
    setHoursTouched(false);
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-header text-lg">Request leave</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Start date</label>
          <DateInput required value={startDate} onChange={setStartDate} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">End date</label>
          <DateInput required value={endDate} onChange={setEndDate} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">
          Hours {computing && <span className="text-ink-soft font-normal">(calculating…)</span>}
        </label>
        <input
          type="number"
          step="0.5"
          min="0"
          value={hours}
          onChange={(e) => {
            setHours(e.target.value);
            setHoursTouched(true);
          }}
          className="w-full rounded-lg border border-line px-3 py-2 text-ink font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-ink-soft mt-1">
          Auto-calculated from your rota and closed days — edit for a partial day.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-line px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {error && (
        <p className="text-sm text-declined" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary text-white font-medium py-2 hover:bg-header transition-colors disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}