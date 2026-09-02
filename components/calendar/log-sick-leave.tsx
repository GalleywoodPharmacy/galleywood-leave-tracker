"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateInput from "@/components/date-input";
import { useToast } from "@/components/toast-provider";

export default function LogSickLeave({ staffList }: { staffList: { id: string; name: string }[] }) {
  const router = useRouter();
  const showToast = useToast();

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setUserId("");
    setStartDate("");
    setEndDate("");
    setNotes("");
    setError(null);
  }

  async function submit() {
    setError(null);
    if (!userId) {
      setError("Choose who this is for.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Pick a start and end date.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/sick-leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, startDate, endDate, notes: notes || undefined }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't log that.");
      return;
    }
    showToast("Sick leave logged");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-line text-sm py-2 hover:bg-card"
      >
        Log sick leave
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-ink">Log sick leave</h3>

            <div>
              <label className="block text-xs text-ink-soft mb-1">Who</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Choose…</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-ink-soft mb-1">Start date</label>
              <DateInput value={startDate} onChange={setStartDate} />
            </div>

            <div>
              <label className="block text-xs text-ink-soft mb-1">End date</label>
              <DateInput value={endDate} onChange={setEndDate} />
            </div>

            <div>
              <label className="block text-xs text-ink-soft mb-1">Notes (optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {error && <p className="text-sm text-declined">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                disabled={submitting}
                onClick={submit}
                className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Log it"}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}