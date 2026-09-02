"use client";

import { useRouter } from "next/navigation";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthSelect({
  year,
  month,
  years,
}: {
  year: number;
  month: number;
  years: number[];
}) {
  const router = useRouter();

  function go(newYear: number, newMonth: number) {
    router.push(`/reports?year=${newYear}&month=${newMonth}`);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={(e) => go(year, parseInt(e.target.value, 10))}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => go(parseInt(e.target.value, 10), month)}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}