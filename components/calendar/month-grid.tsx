import { getClosedReason } from "@/lib/business-rules";
import type { DayData } from "@/lib/calendar";

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-pending/15 text-pending",
  approved: "bg-primary/15 text-primary",
  denied: "bg-declined/15 text-declined",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthGrid({
  year,
  month,
  byDate,
  extraClosedDates,
}: {
  year: number;
  month: number; // 1-12
  byDate: Map<string, DayData>;
  extraClosedDates: Map<string, string>;
}) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()));

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
          const data = byDate.get(key);

          return (
            <div
              key={key}
              title={closed.closed ? closed.label : undefined}
              className={`min-h-[6.5rem] border-b border-r border-line p-1.5 text-xs align-top ${
                inMonth ? "" : "bg-page/60"
              } ${closed.closed ? "bg-[repeating-linear-gradient(45deg,rgba(21,37,34,0.04),rgba(21,37,34,0.04)_6px,transparent_6px,transparent_12px)]" : ""}`}
            >
              <div className={`font-mono ${inMonth ? "text-ink" : "text-ink-soft/60"}`}>{date.getUTCDate()}</div>
              {closed.closed && <div className="text-[10px] text-ink-soft mt-0.5 truncate">{closed.label}</div>}

              <div className="mt-1 space-y-0.5">
                {data?.leave.slice(0, 3).map((l, i) => (
                  <div
                    key={i}
                    className={`truncate rounded px-1 py-0.5 ${STATUS_CHIP[l.status]}`}
                    title={`${l.name} — ${l.type} (${l.status})`}
                  >
                    {l.name.split(" ")[0]}
                  </div>
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
