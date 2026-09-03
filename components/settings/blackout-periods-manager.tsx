"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateInput from "@/components/date-input";
import { easterSunday } from "@/lib/business-rules";

export type BlackoutPeriodItem = { id: string; label: string; startDateKey: string; endDateKeyInclusive: string };

function fmt(key: string) {
  return new Date(key + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** The day before Christmas, for whichever Christmas hasn't happened yet — this year's if still ahead, otherwise next year's. */
function nextChristmasBlackoutEnd(): Date {
  const year = todayUTC().getUTCFullYear();
  const thisYearEnd = new Date(Date.UTC(year, 11, 24));
  return todayUTC() <= thisYearEnd ? thisYearEnd : new Date(Date.UTC(year + 1, 11, 24));
}

/** The day before Good Friday, for whichever Easter hasn't happened yet. */
function nextEasterBlackoutEnd(): Date {
  let year = todayUTC().getUTCFullYear();
  let blackoutEnd = addDays(easterSunday(year), -3); // Good Friday is Easter Sunday - 2; blackout ends the day before that
  if (todayUTC() > blackoutEnd) {
    year += 1;
    blackoutEnd = addDays(easterSunday(year), -3);
  }
  return blackoutEnd;
}

const PRESETS: { key: string; buttonLabel: string; weeks: 1 | 2; anchor: "christmas" | "easter" }[] = [
  { key: "christmas1", buttonLabel: "1 week before Christmas", weeks: 1, anchor: "christmas" },
  { key: "christmas2", buttonLabel: "2 weeks before Christmas", weeks: 2, anchor: "christmas" },
  { key: "easter1", buttonLabel: "1 week before Easter", weeks: 1, anchor: "easter" },
  { key: "easter2", buttonLabel: "2 weeks before Easter", weeks: 2, anchor: "easter" },
];

export default function BlackoutPeriodsManager({ periods }: { periods: BlackoutPeriodItem[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    const end = preset.anchor === "christmas" ? nextChristmasBlackoutEnd() : nextEasterBlackoutEnd();
    const start = addDays(end, -(preset.weeks * 7 - 1));
    setStartDate(toDateKey(start));
    setEndDate(toDateKey(end));
    setLabel(`Pre-${preset.anchor === "christmas" ? "Christmas" : "Easter"} (${preset.weeks} week${preset.weeks > 1 ? "s" : ""})`);
  }

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

  return (
    <div className="space-y-4">
      <div className="bg-white border border-line rounded-xl divide-y divide-line">
        {periods.length === 0 && <p className="px-5 py-4 text-sm text-ink-soft">No blackout periods added.</p>}
        {periods.map((p) => (
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
        ))}
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-line rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-ink">Add a blackout period</h3>

        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Quick pick (fills in the dates below — still editable)</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-card"
              >
                {preset.buttonLabel}
              </button>
            ))}
          </div>
        </div>

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