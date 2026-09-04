"use client";

import { useMemo, useState } from "react";
import TeamRequestRow, { type TeamRequest } from "./team-request-row";
import TeamOvertimeRow, { type TeamOvertime } from "./team-overtime-row";

const STATUS_OPTIONS = ["all", "pending", "approved", "denied", "cancelled"] as const;
const TYPE_OPTIONS = ["all", "annual", "sick", "overtime"] as const;

type CombinedRow =
  | { kind: "leave"; sortDate: number; data: TeamRequest }
  | { kind: "overtime"; sortDate: number; data: TeamOvertime };

export default function ActivityLog({
  requests,
  overtimeEntries,
}: {
  requests: TeamRequest[];
  overtimeEntries: TeamOvertime[];
}) {
  const [staffFilter, setStaffFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]>("all");

  const staffNames = useMemo(
    () => Array.from(new Set([...requests.map((r) => r.userName), ...overtimeEntries.map((o) => o.userName)])).sort(),
    [requests, overtimeEntries]
  );
  const years = useMemo(
    () =>
      Array.from(
        new Set([
          ...requests.map((r) => new Date(r.startDate).getUTCFullYear()),
          ...overtimeEntries.map((o) => new Date(o.date).getUTCFullYear()),
        ])
      ).sort((a, b) => b - a),
    [requests, overtimeEntries]
  );

  const filteredLeave =
    typeFilter === "overtime"
      ? []
      : requests.filter((r) => {
          if (typeFilter !== "all" && r.type !== typeFilter) return false;
          if (staffFilter !== "all" && r.userName !== staffFilter) return false;
          if (yearFilter !== "all" && new Date(r.startDate).getUTCFullYear() !== Number(yearFilter)) return false;
          if (statusFilter !== "all" && r.status !== statusFilter) return false;
          return true;
        });

  // Overtime has no status of its own, so a specific status filter (with
  // Type left at "all") intentionally hides it — selecting Type: Overtime
  // explicitly always shows it regardless of the status filter's value.
  const filteredOvertime = (() => {
    if (typeFilter === "annual" || typeFilter === "sick") return [];
    if (typeFilter === "all" && statusFilter !== "all") return [];
    return overtimeEntries.filter((o) => {
      if (staffFilter !== "all" && o.userName !== staffFilter) return false;
      if (yearFilter !== "all" && new Date(o.date).getUTCFullYear() !== Number(yearFilter)) return false;
      return true;
    });
  })();

  const combined: CombinedRow[] = [
    ...filteredLeave.map((r) => ({ kind: "leave" as const, sortDate: new Date(r.startDate).getTime(), data: r })),
    ...filteredOvertime.map((o) => ({ kind: "overtime" as const, sortDate: new Date(o.date).getTime(), data: o })),
  ].sort((a, b) => b.sortDate - a.sortDate);

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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as (typeof TYPE_OPTIONS)[number])}
          className={selectClasses}
        >
          <option value="all">All types</option>
          <option value="annual">Annual leave</option>
          <option value="sick">Sick leave</option>
          <option value="overtime">Overtime</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
          disabled={typeFilter === "overtime"}
          className={`${selectClasses} disabled:opacity-50`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {(staffFilter !== "all" || yearFilter !== "all" || statusFilter !== "all" || typeFilter !== "all") && (
          <button
            onClick={() => {
              setStaffFilter("all");
              setYearFilter("all");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
            className="text-xs text-declined hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {combined.length === 0 ? (
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
              {combined.map((row, i) =>
                row.kind === "leave" ? (
                  <TeamRequestRow key={`l${row.data.id}`} request={row.data} zebra={i % 2 === 1} />
                ) : (
                  <TeamOvertimeRow key={`o${row.data.id}`} entry={row.data} zebra={i % 2 === 1} />
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}