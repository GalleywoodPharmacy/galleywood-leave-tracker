import { getClosedReason, getBlackoutLabelForDate, type BlackoutPeriod } from "@/lib/business-rules";
import type { DayData } from "@/lib/calendar";
import LeaveChip from "./leave-chip";

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-pending/15 text-pending",
  approved: "bg-primary/15 text-primary",
  denied: "bg-declined/15 text-declined",
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Day-of-week index with Monday = 0 ... Sunday = 6, instead of JS's native Sunday = 0. */
function mondayFirstIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

export default function MonthGrid({
  year,
  month,
  byDate,
  extraClosedDates,
  blackoutPeriods,
  currentUserId,
  isManager,
}: {
  year: number;
  month: number; // 1-12
  byDate: Map<string, DayData>;
  extraClosedDates: Map<string, string>;
  blackoutPeriods: BlackoutPeriod[];
  currentUserId: string;
  isManager: boolean;
}) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - mondayFirstIndex(monthStart));
  const gridEnd = new Date(monthEnd);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - mondayFirstIndex(monthEnd)));

  const days: Date[] = [];
  for (let d = new Date(gridStart); d.getTime() <= gridEnd.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(new Date(d));
  }

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 text-xs font-medium text-ink-soft border-b border-line">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="px-2 py-2 text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const key = date.toISOString().slice(0, 10);
          const inMonth = date.getUTCMonth() === month - 1;
          const closed = getClosedReason(date, extraClosedDates);
          const blackoutLabel = !closed.closed ? getBlackoutLabelForDate(key, blackoutPeriods) : null;
          const data = byDate.get(key);

          return (
            <div
              key={key}
              title={closed.closed ? closed.label : blackoutLabel ?? undefined}
              className={`min-h-[6.5rem] border-b border-r border-line p-1.5 text-xs align-top ${
                inMonth ? "" : "bg-page/60"
              } ${
                closed.closed
                  ? "bg-[repeating-linear-gradient(45deg,rgba(21,37,34,0.04),rgba(21,37,34,0.04)_6px,transparent_6px,transparent_12px)]"
                  : blackoutLabel
                    ? "bg-ink-soft/10"
                    : ""
              }`}
            >
              <div className={`font-mono ${inMonth ? "text-ink" : "text-ink-soft/60"}`}>{date.getUTCDate()}</div>
              {closed.closed && <div className="text-[10px] text-ink-soft mt-0.5 truncate">{closed.label}</div>}
              {!closed.closed && blackoutLabel && (
                <div className="text-[10px] text-ink-soft mt-0.5 truncate">Black out period</div>
              )}

              <div className="mt-1 space-y-0.5">
                {data?.leave.slice(0, 3).map((l, i) => (
                  <LeaveChip
                    key={i}
                    requestId={l.requestId}
                    name={l.name}
                    status={l.status}
                    coverName={l.coverName}
                    canEdit={l.userId === currentUserId || isManager}
                    statusClass={STATUS_CHIP[l.status]}
                    dateLabel={formatDayLabel(date)}
                    dayKey={key}
                    periodStart={l.periodStart}
                    periodEnd={l.periodEnd}
                  />
                ))}
                {data && data.leave.length > 3 && (
                  <div className="text-[10px] text-ink-soft">+{data.leave.length - 3} more</div>
                )}
                {data?.coverage.slice(0, 2).map((name, i) => (
                  <div key={`c${i}`} className="truncate rounded px-1 py-0.5 bg-coverage/15 text-coverage" title={`${name} covering`}>
                    ☂ {name.split(" ")[0]}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}