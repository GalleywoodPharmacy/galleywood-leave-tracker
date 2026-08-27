"use client";

import { useMemo, useState } from "react";
import TeamRequestRow, { type TeamRequest } from "./team-request-row";

const STATUS_OPTIONS = ["all", "pending", "approved", "denied", "cancelled"] as const;

export default function ActivityLog({ requests }: { requests: TeamRequest[] }) {
  const [staffFilter, setStaffFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");

  const staffNames = useMemo(
    () => Array.from(new Set(requests.map((r) => r.userName))).sort(),
    [requests]
  );
  const years = useMemo(
    () =>
      Array.from(new Set(requests.map((r) => new Date(r.startDate).getUTCFullYear()))).sort((a, b) => b - a),
    [requests]
  );

  const filtered = requests.filter((r) => {
    if (staffFilter !== "all" && r.userName !== staffFilter) return false;
    if (yearFilter !== "all" && new Date(r.startDate).getUTCFullYear() !== Number(yearFilter)) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const selectClasses =
    "rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-2 items-center px-5 py-3 border-b border-line bg-page/60">
        <span className="text-xs text-ink-soft">Filter:</span>
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className={selectClasses}>
          <option value="all">All staff</option>
          {staffNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={selectClasses}>
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
          className={selectClasses}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {(staffFilter !== "all" || yearFilter !== "all" || statusFilter !== "all") && (
          <button
            onClick={() => {
              setStaffFilter("all");
              setYearFilter("all");
              setStatusFilter("all");
            }}
            className="text-xs text-declined hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="p-5 text-sm text-ink-soft">No requests match those filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-soft">
                <th className="px-5 py-3 font-medium">Staff</th>
                <th className="px-5 py-3 font-medium">Dates</th>
                <th className="px-5 py-3 font-medium">Hours</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <TeamRequestRow key={r.id} request={r} zebra={i % 2 === 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}