import type { ShiftWithComparison } from "@/lib/timeclock";

function fmtDate(key: string) {
  return new Date(key + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
}

const COMPARISON_LABEL: Record<ShiftWithComparison["comparison"], string> = {
  under: "Under rota",
  over: "Over rota",
  "on-track": "On track",
  "in-progress": "In progress",
};
const COMPARISON_CLASS: Record<ShiftWithComparison["comparison"], string> = {
  under: "bg-declined/10 text-declined",
  over: "bg-pending/10 text-pending",
  "on-track": "bg-primary/10 text-primary",
  "in-progress": "bg-coverage/10 text-coverage",
};

export default function ShiftHistory({ shifts }: { shifts: ShiftWithComparison[] }) {
  if (shifts.length === 0) {
    return (
      <div className="bg-white border border-line rounded-xl p-5 text-sm text-ink-soft">No shifts logged yet.</div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-soft">
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">In</th>
            <th className="px-5 py-3 font-medium">Out</th>
            <th className="px-5 py-3 font-medium">Hours</th>
            <th className="px-5 py-3 font-medium">Rota</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((s, i) => (
            <tr key={s.id} className={i % 2 === 1 ? "bg-card/40" : ""}>
              <td className="px-5 py-3 border-t border-line font-mono text-xs">{fmtDate(s.date)}</td>
              <td className="px-5 py-3 border-t border-line font-mono text-xs">{fmtTime(s.clockInAt)}</td>
              <td className="px-5 py-3 border-t border-line font-mono text-xs">
                {s.clockOutAt ? fmtTime(s.clockOutAt) : "—"}
              </td>
              <td className="px-5 py-3 border-t border-line font-mono">
                {s.hoursWorked !== null ? `${s.hoursWorked}h` : "—"}
              </td>
              <td className="px-5 py-3 border-t border-line font-mono text-xs text-ink-soft">{s.rotaHours}h</td>
              <td className="px-5 py-3 border-t border-line">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${COMPARISON_CLASS[s.comparison]}`}
                >
                  {COMPARISON_LABEL[s.comparison]}
                  {s.differenceHours !== null && s.comparison !== "on-track" && (
                    <>
                      {" "}
                      ({s.differenceHours > 0 ? "+" : ""}
                      {s.differenceHours}h)
                    </>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}