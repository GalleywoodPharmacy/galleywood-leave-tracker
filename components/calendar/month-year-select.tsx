"use client";

import { useRouter } from "next/navigation";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarMonthYearSelect({
  year,
  month,
  selQuery,
}: {
  year: number;
  month: number;
  selQuery: string;
}) {
  const router = useRouter();
  const currentYear = new Date().getUTCFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);
  if (!years.includes(year)) {
    years.push(year);
    years.sort((a, b) => a - b);
  }

  function navigate(newYear: number, newMonth: number) {
    router.push(`/calendar?year=${newYear}&month=${newMonth}${selQuery}`);
  }

  const selectClasses =
    "rounded-lg border border-line px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="flex gap-2">
      <select
        value={month}
        onChange={(e) => navigate(year, Number(e.target.value))}
        className={selectClasses}
        aria-label="Month"
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => navigate(Number(e.target.value), month)}
        className={selectClasses}
        aria-label="Year"
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