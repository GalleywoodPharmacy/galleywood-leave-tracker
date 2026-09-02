"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getBlackoutLabelForDate, type BlackoutPeriod } from "@/lib/business-rules";
import { useToast } from "@/components/toast-provider";
import type { DayData } from "@/lib/calendar";

function fmt(dateKey: string) {
  return new Date(dateKey + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysBetweenInclusive(a: string, b: string) {
  const start = new Date(a + "T00:00:00.000Z");
  const end = new Date(b + "T00:00:00.000Z");
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

function CalendarRequestFormInner({
  currentUserId,
  byDate,
  blackoutPeriods,
}: {
  currentUserId: string;
  byDate: Map<string, DayData>;
  blackoutPeriods: BlackoutPeriod[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showToast = useToast();

  const selStart = searchParams.get("selStart");
  const selEnd = searchParams.get("selEnd");

  const [hours, setHours] = useState("");
  const [hoursTouched, setHoursTouched] = useState(false);
  const [computing, setComputing] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmWarnings, setConfirmWarnings] = useState<string[] | null>(null);

  const fetchAutoHours = useCallback(async (start: string, end: string) => {
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
    if (selStart && selEnd && !hoursTouched) {
      fetchAutoHours(selStart, selEnd);
    }
    if (!selStart || !selEnd) {
      setHours("");
      setHoursTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selStart, selEnd]);

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("selStart");
    params.delete("selEnd");
    router.push(`${pathname}?${params.toString()}`);
    setNotes("");
    setError(null);
  }

  function computeWarnings(start: string, end: string): string[] {
    const warnings: string[] = [];

    const overlapNames = new Set<string>();
    let cursor = new Date(start + "T00:00:00.000Z");
    const endDate = new Date(end + "T00:00:00.000Z");
    while (cursor.getTime() <= endDate.getTime()) {
      const key = cursor.toISOString().slice(0, 10);
      const day = byDate.get(key);
      day?.leave.forEach((l) => {
        if (l.userId !== currentUserId && (l.status === "approved" || l.status === "pending")) {
          overlapNames.add(l.name.split(" ")[0]);
        }
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    if (overlapNames.size > 0) {
      warnings.push(
        `Your leave request overlaps ${Array.from(overlapNames).join(", ")}'s leave. Do you wish to proceed? If you do, this leave may not be approved.`
      );
    }

    if (daysBetweenInclusive(start, end) > 14) {
      warnings.push(
        "This request is for more than 2 consecutive weeks, which is normally only approved for special occasions. Do you wish to proceed anyway?"
      );
    }

    cursor = new Date(start + "T00:00:00.000Z");
    let hitBlackout = false;
    while (cursor.getTime() <= endDate.getTime()) {
      const key = cursor.toISOString().slice(0, 10);
      if (getBlackoutLabelForDate(key, blackoutPeriods)) {
        hitBlackout = true;
        break;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    if (hitBlackout) {
      warnings.push("Part of this request falls within a black out period. Do you wish to proceed anyway?");
    }

    return warnings;
  }

  async function doSubmit() {
    if (!selStart || !selEnd) return;
    const parsedHours = parseFloat(hours);
    if (!parsedHours || parsedHours <= 0) {
      setError("Enter how many hours this request covers.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: selStart, endDate: selEnd, hours: parsedHours, notes: notes || undefined }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Couldn't submit that request.");
      return;
    }

    showToast("Leave request submitted");
    clearSelection();
    router.refresh();
  }

  function handleSubmitClick() {
    setError(null);
    if (!selStart || !selEnd) {
      setError("Click a day on the calendar to choose your dates.");
      return;
    }
    const warnings = computeWarnings(selStart, selEnd);
    if (warnings.length > 0) {
      setConfirmWarnings(warnings);
      return;
    }
    doSubmit();
  }

  return (
    <div className="bg-white border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-header text-lg">Request leave</h2>
      <p className="text-xs text-ink-soft">
        Click a day on the calendar to start. Click it again for a single day, or click a later day to select a
        range.
      </p>

      <div className="text-sm space-y-1">
        <div>
          <span className="text-ink-soft">Start: </span>
          <span className="font-mono">{selStart ? fmt(selStart) : "—"}</span>
        </div>
        <div>
          <span className="text-ink-soft">End: </span>
          <span className="font-mono">{selEnd ? fmt(selEnd) : "—"}</span>
        </div>
      </div>

      {(selStart || selEnd) && (
        <button type="button" onClick={clearSelection} className="text-xs text-declined hover:underline">
          Clear selection
        </button>
      )}

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
        <p className="text-xs text-ink-soft mt-1">Auto-calculated from your rota and closed days.</p>
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
        type="button"
        onClick={handleSubmitClick}
        disabled={submitting || !selStart || !selEnd}
        className="w-full rounded-lg bg-primary text-white font-medium py-2 hover:bg-header transition-colors disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit request"}
      </button>

      {confirmWarnings && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
          onClick={() => setConfirmWarnings(null)}
        >
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-ink">Before you submit</h3>
            {confirmWarnings.map((w, i) => (
              <p key={i} className="text-sm text-ink-soft">
                {w}
              </p>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setConfirmWarnings(null);
                  doSubmit();
                }}
                className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header"
              >
                Submit anyway
              </button>
              <button
                onClick={() => setConfirmWarnings(null)}
                className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarRequestForm(props: {
  currentUserId: string;
  byDate: Map<string, DayData>;
  blackoutPeriods: BlackoutPeriod[];
}) {
  return (
    <Suspense fallback={null}>
      <CalendarRequestFormInner {...props} />
    </Suspense>
  );
}