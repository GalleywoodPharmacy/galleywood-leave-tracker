"use client";

import { useEffect, useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseISO(value: string) {
  if (!value) return { day: "", month: "", year: "" };
  const [y, m, d] = value.split("-");
  return {
    day: d ? String(parseInt(d, 10)) : "",
    month: m ? String(parseInt(m, 10) - 1) : "",
    year: y ?? "",
  };
}

function toISO(day: string, month: string, year: string): string {
  if (!day || month === "" || !year || year.length < 4) return "";
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31 || isNaN(monthNum)) return "";
  const d = String(dayNum).padStart(2, "0");
  const m = String(monthNum + 1).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/**
 * Always-unambiguous date input: separate Day / Month-name / Year fields
 * instead of a single browser-native date picker (whose displayed format
 * depends on the browser/OS language setting and can't be reliably forced
 * to dd/mm/yyyy from the page alone). Month is a dropdown of names, so
 * there's no numeric month-vs-day ordering to misread, on any device.
 *
 * Behaves like a controlled text input: value/onChange both use the same
 * "YYYY-MM-DD" string (or "" when incomplete) the rest of the app already
 * works with, so it drops in wherever a native `<input type="date">` was.
 */
export default function DateInput({
  value,
  onChange,
  className = "",
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}) {
  const parsed = parseISO(value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    const p = parseISO(value);
    setDay(p.day);
    setMonth(p.month);
    setYear(p.year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function update(newDay: string, newMonth: string, newYear: string) {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);
    onChange(toISO(newDay, newMonth, newYear));
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      <input
        type="number"
        inputMode="numeric"
        placeholder="DD"
        min={1}
        max={31}
        value={day}
        onChange={(e) => update(e.target.value.slice(0, 2), month, year)}
        className="w-12 rounded-lg border border-line bg-white px-1.5 py-1.5 text-sm font-mono text-center text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent"
        required={required}
      />
      <select
        value={month}
        onChange={(e) => update(day, e.target.value, year)}
        className={`w-[4.5rem] rounded-lg border border-line bg-white px-1 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
          month === "" ? "text-ink-soft" : "text-ink"
        }`}
        required={required}
      >
        <option value="" className="text-ink-soft">
          Month
        </option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i} className="text-ink">
            {m}
          </option>
        ))}
      </select>
      <input
        type="number"
        inputMode="numeric"
        placeholder="YYYY"
        value={year}
        onChange={(e) => update(day, month, e.target.value.slice(0, 4))}
        className="w-16 rounded-lg border border-line bg-white px-1.5 py-1.5 text-sm font-mono text-center text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent"
        required={required}
      />
    </div>
  );
}