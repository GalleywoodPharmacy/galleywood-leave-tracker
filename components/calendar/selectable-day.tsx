"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateInput from "@/components/date-input";
import { useToast } from "@/components/toast-provider";

function fmt(dateKey: string) {
  return new Date(dateKey + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SelectableDay({
  dateKey,
  year,
  month,
  selStart,
  selEnd,
  title,
  className,
  children,
  isManager,
  staffList,
}: {
  dateKey: string;
  year: number;
  month: number;
  selStart: string | null;
  selEnd: string | null;
  title?: string;
  className?: string;
  children: React.ReactNode;
  isManager: boolean;
  staffList: { id: string; name: string }[];
}) {
  const router = useRouter();
  const showToast = useToast();

  const [banner, setBanner] = useState(false);
  const [mode, setMode] = useState<"choose" | "sickness" | "overtime">("choose");

  const [sickUserId, setSickUserId] = useState("");
  const [sickStart, setSickStart] = useState(dateKey);
  const [sickEnd, setSickEnd] = useState(dateKey);
  const [sickEndTouched, setSickEndTouched] = useState(false);
  const [sickNotes, setSickNotes] = useState("");
  const [sickSubmitting, setSickSubmitting] = useState(false);
  const [sickError, setSickError] = useState<string | null>(null);

  const [otHours, setOtHours] = useState("");
  const [otNotes, setOtNotes] = useState("");
  const [otSubmitting, setOtSubmitting] = useState(false);
  const [otError, setOtError] = useState<string | null>(null);

  const inRange = !!(selStart && selEnd && dateKey >= selStart && dateKey <= selEnd);
  const isAnchor = dateKey === selStart || dateKey === selEnd;

  function openBanner(e: React.MouseEvent) {
    e.stopPropagation();
    setMode("choose");
    setSickUserId("");
    setSickStart(dateKey);
    setSickEnd(dateKey);
    setSickEndTouched(false);
    setSickNotes("");
    setSickError(null);
    setOtHours("");
    setOtNotes("");
    setOtError(null);
    setBanner(true);
  }

  function closeBanner() {
    setBanner(false);
  }

  function chooseAnnualLeave() {
    let newStart = selStart;
    let newEnd = selEnd;

    if (!selStart) {
      newStart = dateKey;
      newEnd = null;
    } else if (!selEnd) {
      if (dateKey < selStart) {
        newStart = dateKey;
        newEnd = null;
      } else {
        newEnd = dateKey;
      }
    } else {
      newStart = dateKey;
      newEnd = null;
    }

    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));
    if (newStart) params.set("selStart", newStart);
    if (newEnd) params.set("selEnd", newEnd);
    closeBanner();
    router.push(`/calendar?${params.toString()}`);
  }

  function handleSickStartChange(value: string) {
    setSickStart(value);
    if (!sickEndTouched) setSickEnd(value);
  }
  function handleSickEndChange(value: string) {
    setSickEndTouched(true);
    setSickEnd(value);
  }

  async function submitSickness() {
    setSickError(null);
    if (!sickUserId) {
      setSickError("Choose who this is for.");
      return;
    }
    if (!sickStart || !sickEnd) {
      setSickError("Pick a start and end date.");
      return;
    }
    setSickSubmitting(true);
    const res = await fetch("/api/sick-leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: sickUserId,
        startDate: sickStart,
        endDate: sickEnd,
        notes: sickNotes || undefined,
        openEnded: !sickEndTouched,
      }),
    });
    setSickSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSickError(data.error ?? "Couldn't log that.");
      return;
    }
    showToast("Sick leave logged");
    closeBanner();
    router.refresh();
  }

  async function submitOvertime() {
    setOtError(null);
    const hoursNum = parseFloat(otHours);
    if (!hoursNum || hoursNum <= 0) {
      setOtError("Enter how many hours.");
      return;
    }
    setOtSubmitting(true);
    const res = await fetch("/api/overtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, hours: hoursNum, notes: otNotes || undefined }),
    });
    setOtSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setOtError(data.error ?? "Couldn't log that.");
      return;
    }
    showToast("Overtime logged");
    closeBanner();
    router.refresh();
  }

  return (
    <>
      <div
        onClick={openBanner}
        title={title}
        className={`cursor-pointer ${className ?? ""} ${
          inRange || isAnchor ? "ring-2 ring-inset ring-accent bg-accent/10" : ""
        }`}
      >
        {children}
      </div>

      {banner && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4" onClick={closeBanner}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            {mode === "choose" && (
              <>
                <h3 className="text-sm font-medium text-ink mb-0.5">{fmt(dateKey)}</h3>
                <p className="text-xs text-ink-soft mb-2">What would you like to do?</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={chooseAnnualLeave}
                    className="rounded-lg border border-line text-sm py-2 px-3 text-left hover:bg-card"
                  >
                    Request annual leave
                  </button>
                  {isManager && (
                    <button
                      onClick={() => setMode("sickness")}
                      className="rounded-lg border border-line text-sm py-2 px-3 text-left hover:bg-card"
                    >
                      Log sickness
                    </button>
                  )}
                  <button
                    onClick={() => setMode("overtime")}
                    className="rounded-lg border border-line text-sm py-2 px-3 text-left hover:bg-card"
                  >
                    Log overtime
                  </button>
                </div>
                <button onClick={closeBanner} className="w-full text-xs text-ink-soft mt-2 hover:underline">
                  Cancel
                </button>
              </>
            )}

            {mode === "sickness" && (
              <>
                <h3 className="text-sm font-medium text-ink">Log sick leave</h3>
                <div>
                  <label className="block text-xs text-ink-soft mb-1">Who</label>
                  <select
                    value={sickUserId}
                    onChange={(e) => setSickUserId(e.target.value)}
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
                  <DateInput value={sickStart} onChange={handleSickStartChange} />
                </div>
                <div>
                  <label className="block text-xs text-ink-soft mb-1">End date</label>
                  <DateInput value={sickEnd} onChange={handleSickEndChange} />
                  <p className="text-xs text-ink-soft mt-1">
                    Not sure yet? Leave this matching the start date — you can extend it later from Team &amp;
                    Approvals.
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-ink-soft mb-1">Notes (optional)</label>
                  <input
                    value={sickNotes}
                    onChange={(e) => setSickNotes(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                {sickError && <p className="text-sm text-declined">{sickError}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    disabled={sickSubmitting}
                    onClick={submitSickness}
                    className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
                  >
                    {sickSubmitting ? "Saving…" : "Log it"}
                  </button>
                  <button
                    onClick={() => setMode("choose")}
                    className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {mode === "overtime" && (
              <>
                <h3 className="text-sm font-medium text-ink">Log overtime</h3>
                <p className="text-xs text-ink-soft">{fmt(dateKey)}</p>
                <div>
                  <label className="block text-xs text-ink-soft mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={otHours}
                    onChange={(e) => setOtHours(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-soft mb-1">Notes (optional)</label>
                  <input
                    value={otNotes}
                    onChange={(e) => setOtNotes(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                {otError && <p className="text-sm text-declined">{otError}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    disabled={otSubmitting}
                    onClick={submitOvertime}
                    className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
                  >
                    {otSubmitting ? "Saving…" : "Log it"}
                  </button>
                  <button
                    onClick={() => setMode("choose")}
                    className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}