function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}

export default function UpcomingLeaveCard({
  leave,
}: {
  leave: { startDate: string; endDate: string; hours: number } | null;
}) {
  if (!leave) return null;

  const now = new Date();
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const inProgress = start <= now && now <= end;

  return (
    <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
      <div className="text-sm text-ink">
        <span className="font-medium text-header">{inProgress ? "You're off now" : "Your next leave"}</span>{" "}
        — {fmt(leave.startDate)} to {fmt(leave.endDate)}
      </div>
      <span className="text-xs font-mono text-ink-soft">{leave.hours}h</span>
    </div>
  );
}