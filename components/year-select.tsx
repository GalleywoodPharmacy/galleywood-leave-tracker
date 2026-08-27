"use client";

import { useRouter } from "next/navigation";

export default function YearSelect({
  years,
  selectedYear,
  basePath,
}: {
  years: number[];
  selectedYear: number;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedYear}
      onChange={(e) => router.push(`${basePath}?year=${e.target.value}`)}
      className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-mono text-header font-medium focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}